

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getArtists, getLookups, getRecentTracks, getTracks } from "../services/api.js";

const HOME_PAGE_SIZE = 24;


// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeFilterId(value) {
  if (value === undefined || value === null || value === "" || value === "all") return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) && numeric > 0 ? numeric : null;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useHomeData({ searchQuery, moodFilter, genreFilter, isAuthenticated }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [tracks, setTracks] = useState([]);
  const [artists, setArtists] = useState([]);
  const [recent, setRecent] = useState([]);
  const [recentLoading, setRecentLoading] = useState(false);
  const [recentStatus, setRecentStatus] = useState("idle");
  const [recentError, setRecentError] = useState("");
  const [moodsList, setMoodsList] = useState(null);
  const [genresList, setGenresList] = useState(null);
  const [browseStatus, setBrowseStatus] = useState("idle");
  const [browseError, setBrowseError] = useState("");
  const [hasMoreTracks, setHasMoreTracks] = useState(false);
  const [_browseNextSkip, setBrowseNextSkip] = useState(0);
  const [loadingMoreTracks, setLoadingMoreTracks] = useState(false);
  const [newReleaseTracks, setNewReleaseTracks] = useState([]);
  const [newReleaseStatus, setNewReleaseStatus] = useState("idle");
  const [newReleaseError, setNewReleaseError] = useState("");

  const artistSearchAbortRef = useRef(null);
  const artistSearchRequestIdRef = useRef(0);
  const browseRequestIdRef = useRef(0);
  const newReleaseRequestIdRef = useRef(0);
  const recentTimerRef = useRef(null);
  const browseNextSkipRef = useRef(0);

  
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const normalizedGenreId = useMemo(() => normalizeFilterId(genreFilter), [genreFilter]);
  
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const normalizedMoodId = useMemo(() => normalizeFilterId(moodFilter), [moodFilter]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const fetchNewReleasePreview = useCallback(async () => {
    const requestId = newReleaseRequestIdRef.current + 1;
    newReleaseRequestIdRef.current = requestId;
    setNewReleaseStatus("loading");
    setNewReleaseError("");

    try {
      const res = await getTracks({
        q: searchQuery || undefined,
        genreId: normalizedGenreId,
        moodId: normalizedMoodId,
        sort: "new",
        take: 8,
        skip: 0,
      });

      if (newReleaseRequestIdRef.current !== requestId) return;

      if (!res.ok) {
        setNewReleaseTracks([]);
        setNewReleaseStatus("hard-error");
        setNewReleaseError(res.error || "Failed to load new releases");
        return;
      }

      const nextItems = Array.isArray(res.data?.items) ? res.data.items : [];
      setNewReleaseTracks(nextItems);
      setNewReleaseStatus(nextItems.length > 0 ? "success" : "empty");
      setNewReleaseError("");
    } catch (error) {
      if (newReleaseRequestIdRef.current !== requestId) return;
      setNewReleaseTracks([]);
      setNewReleaseStatus("hard-error");
      setNewReleaseError(error?.message || "Failed to load new releases");
    }
  }, [normalizedGenreId, normalizedMoodId, searchQuery]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadArtists = useCallback(async (value) => {
    const term = String(value || "").trim();
    const requestId = artistSearchRequestIdRef.current + 1;
    artistSearchRequestIdRef.current = requestId;

    if (artistSearchAbortRef.current) {
      artistSearchAbortRef.current.abort();
      artistSearchAbortRef.current = null;
    }

    if (!term) {
      setArtists([]);
      return;
    }

    const controller = new AbortController();
    artistSearchAbortRef.current = controller;

    try {
      const res = await getArtists(term, { signal: controller.signal, take: 12 });
      if (artistSearchRequestIdRef.current !== requestId) return;
      setArtists(res.ok && Array.isArray(res.data) ? res.data : []);
    } catch {
      if (!controller.signal.aborted) setArtists([]);
    } finally {
      if (artistSearchAbortRef.current === controller) artistSearchAbortRef.current = null;
    }
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const fetchTracksPage = useCallback(async ({ append }) => {
    const requestId = browseRequestIdRef.current + 1;
    browseRequestIdRef.current = requestId;

    if (!append) {
      browseNextSkipRef.current = 0;
      setBrowseNextSkip(0);
      setBrowseStatus("loading");
      setBrowseError("");
    } else {
      setLoadingMoreTracks(true);
    }

    const currentSkip = append ? browseNextSkipRef.current : 0;

    try {
      const res = await getTracks({
        q: searchQuery || undefined,
        genreId: normalizedGenreId,
        moodId: normalizedMoodId,
        sort: searchQuery ? "title" : "popular",
        take: HOME_PAGE_SIZE,
        skip: currentSkip,
      });

      if (browseRequestIdRef.current !== requestId) return;

      if (!res.ok) {
        if (!append) {
          browseNextSkipRef.current = 0;
          setTracks([]);
          setBrowseNextSkip(0);
          setHasMoreTracks(false);
          setBrowseStatus("hard-error");
          setBrowseError(res.error || "Failed to load tracks");
        }
        return;
      }

      const page = res.data || {};
      const nextItems = Array.isArray(page.items) ? page.items : [];
      const resolvedNextSkip = Number.isFinite(Number(page.nextSkip)) ? Number(page.nextSkip) : currentSkip + nextItems.length;
      browseNextSkipRef.current = resolvedNextSkip;
      setTracks((prev) => (append ? [...prev, ...nextItems] : nextItems));
      setBrowseNextSkip(resolvedNextSkip);
      setHasMoreTracks(!!page.hasMore);
      setBrowseStatus(nextItems.length > 0 || append || currentSkip > 0 ? "success" : "empty");
      setBrowseError("");
    } catch (error) {
      if (browseRequestIdRef.current !== requestId) return;
      if (!append) {
        browseNextSkipRef.current = 0;
        setTracks([]);
        setBrowseNextSkip(0);
        setHasMoreTracks(false);
        setBrowseStatus("hard-error");
        setBrowseError(error?.message || "Failed to load tracks");
      }
    } finally {
      if (append && browseRequestIdRef.current === requestId) {
        setLoadingMoreTracks(false);
      }
    }
  }, [normalizedGenreId, normalizedMoodId, searchQuery]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadTracks = useCallback(async () => {
    await fetchTracksPage({ append: false });
  }, [fetchTracksPage]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadMoreTracks = useCallback(async () => {
    if (loadingMoreTracks || !hasMoreTracks || browseStatus === "loading") return;
    await fetchTracksPage({ append: true });
  }, [browseStatus, fetchTracksPage, hasMoreTracks, loadingMoreTracks]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadLookups = useCallback(async () => {
    try {
      const res = await getLookups();
      if (!res.ok) {
        setMoodsList([]);
        setGenresList([]);
        return;
      }
      setMoodsList(Array.isArray(res.data?.moods) ? res.data.moods : []);
      setGenresList(Array.isArray(res.data?.genres) ? res.data.genres : []);
    } catch {
      setMoodsList([]);
      setGenresList([]);
    }
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadRecentInitial = useCallback(async () => {
    if (!isAuthenticated) {
      setRecent([]);
      setRecentStatus("idle");
      setRecentError("");
      return;
    }

    setRecentLoading(true);
    setRecentStatus("loading");
    setRecentError("");
    try {
      const res = await getRecentTracks(12);
      if (!res.ok) {
        setRecent([]);
        setRecentStatus("hard-error");
        setRecentError(res.error || "Failed to load recent tracks");
        return;
      }

      const nextRecent = Array.isArray(res.data) ? res.data : [];
      setRecent(nextRecent);
      setRecentStatus(nextRecent.length > 0 ? "success" : "empty");
      setRecentError("");
    } catch (error) {
      setRecent([]);
      setRecentStatus("hard-error");
      setRecentError(error?.message || "Failed to load recent tracks");
    } finally {
      setRecentLoading(false);
    }
  }, [isAuthenticated]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const refreshRecentSilent = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const res = await getRecentTracks(12);
      if (!res.ok) {
        if (recent.length === 0) {
          setRecentStatus("hard-error");
          setRecentError(res.error || "Failed to load recent tracks");
        }
        return;
      }

      const nextRecent = Array.isArray(res.data) ? res.data : [];
      setRecent(nextRecent);
      setRecentStatus(nextRecent.length > 0 ? "success" : "empty");
      setRecentError("");
    } catch (error) {
      if (recent.length === 0) {
        setRecentStatus("hard-error");
        setRecentError(error?.message || "Failed to load recent tracks");
      }
    }
  }, [isAuthenticated, recent.length]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    loadLookups();
  }, [loadLookups]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    loadTracks();
  }, [loadTracks]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    fetchNewReleasePreview();
  }, [fetchNewReleasePreview]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    loadArtists(searchQuery);
    return () => {
      if (artistSearchAbortRef.current) artistSearchAbortRef.current.abort();
    };
  }, [loadArtists, searchQuery]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    loadRecentInitial();
  }, [loadRecentInitial]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => () => {
    if (recentTimerRef.current) clearTimeout(recentTimerRef.current);
  }, []);

  return {
    artists,
    browseError,
    browseStatus,
    genresList,
    hasMoreTracks,
    loadMoreTracks,
    loadingMoreTracks,
    moodsList,
    newReleaseError,
    newReleaseStatus,
    newReleaseTracks,
    recent,
    recentError,
    recentLoading,
    recentStatus,
    recentTimerRef,
    refreshRecentSilent,
    setRecent,
    setTracks,
    tracks,
  };
}

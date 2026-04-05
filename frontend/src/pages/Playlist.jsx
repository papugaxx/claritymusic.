

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { getPlaylist, removeTrackFromPlaylist } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { usePlayerActions, usePlayerLikesState, usePlayerQueueState } from "../context/PlayerContext.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import TrackItem from "../components/track/TrackItem.jsx";
import UiSelect from "../components/ui/UiSelect.jsx";
import CoverArt from "../components/media/CoverArt.jsx";
import { ShuffleIcon } from "../components/player/PlayerIcons.jsx";
import { useAppState } from "../context/AppStateContext.jsx";

const PAGE_SIZE = 50;

// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeTrackPage(value) {
  return {
    items: Array.isArray(value?.items) ? value.items : [],
    totalCount: Number.isFinite(Number(value?.totalCount)) ? Number(value.totalCount) : 0,
    hasMore: !!value?.hasMore,
    nextSkip: Number.isFinite(Number(value?.nextSkip)) ? Number(value.nextSkip) : null,
  };
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Playlist() {
  const { id } = useParams();
  const playlistId = Number(id);

  const { me, loading } = useAuth();
  const isAuth = !!me?.isAuthenticated;
  const playerQueue = usePlayerQueueState();
  const playerActions = usePlayerActions();
  const playerLikes = usePlayerLikesState();
  const p = { ...playerQueue, ...playerActions, ...playerLikes };
  const { t } = useI18n();
  const { playlistsVersion, playsVersion, lastPlayEvent, notifyPlaylistsChanged } = useAppState();

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [playlist, setPlaylist] = useState(null);
  const [tracks, setTracks] = useState([]);
  const [err, setErr] = useState("");
  const [removeError, setRemoveError] = useState("");
  const [loadMoreError, setLoadMoreError] = useState("");
  const [status, setStatus] = useState("idle");
  const [sortBy, setSortBy] = useState("added_desc");
  const [hasMore, setHasMore] = useState(false);
  const [_nextSkip, setNextSkip] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [removingTrackId, setRemovingTrackId] = useState(null);
  const visibleCountRef = useRef(0);
  const nextSkipRef = useRef(0);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const applyLoadedPlaylist = useCallback((nextPlaylist, trackPage, append) => {
    const page = normalizeTrackPage(trackPage);
    const resolvedNextSkip = Number.isFinite(Number(page.nextSkip)) ? Number(page.nextSkip) : (append ? visibleCountRef.current : page.items.length);
    setPlaylist((prev) => ({ ...(prev || {}), ...(nextPlaylist || {}) }));
    setTracks((prev) => {
      const next = append ? [...prev, ...page.items] : page.items;
      visibleCountRef.current = next.length;
      return next;
    });
    nextSkipRef.current = resolvedNextSkip;
    setHasMore(page.hasMore);
    setNextSkip(resolvedNextSkip);
    setTotalCount(page.totalCount);
    setStatus(page.items.length > 0 || append || page.totalCount > 0 ? "success" : "empty");
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const load = useCallback(async ({ append = false, signal } = {}) => {
    if (!append) {
      nextSkipRef.current = 0;
      setNextSkip(0);
      setErr("");
      setRemoveError("");
      setLoadMoreError("");
      setStatus("loading");
    } else {
      setLoadingMore(true);
      setLoadMoreError("");
    }

    if (!playlistId) {
      nextSkipRef.current = 0;
      visibleCountRef.current = 0;
      setPlaylist(null);
      setTracks([]);
      setHasMore(false);
      setNextSkip(0);
      setTotalCount(0);
      setStatus("empty");
      return;
    }

    const skip = append ? nextSkipRef.current : 0;

    try {
      const res = await getPlaylist(playlistId, { signal, take: PAGE_SIZE, skip, sort: sortBy });
      if (signal?.aborted) return;

      if (!res.ok) {
        const message = res.error || t("playlist.notFound");
        if (!append) {
          nextSkipRef.current = 0;
          visibleCountRef.current = 0;
          setErr(message);
          setPlaylist(null);
          setTracks([]);
          setHasMore(false);
          setNextSkip(0);
          setTotalCount(0);
          setStatus("hard-error");
        } else {
          setLoadMoreError(message);
        }
        return;
      }

      const nextPlaylist = res.data ?? null;
      applyLoadedPlaylist(nextPlaylist, nextPlaylist?.tracks, append);
    } catch (e) {
      if (signal?.aborted) return;
      const message = e?.message || t("playlist.loadFailed");
      if (!append) {
        nextSkipRef.current = 0;
        visibleCountRef.current = 0;
        setErr(message);
        setPlaylist(null);
        setTracks([]);
        setHasMore(false);
        setNextSkip(0);
        setTotalCount(0);
        setStatus("hard-error");
      } else {
        setLoadMoreError(message);
      }
    } finally {
      if (append) setLoadingMore(false);
    }
  }, [applyLoadedPlaylist, playlistId, sortBy, t]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const reloadVisibleWindow = useCallback(async ({ signal } = {}) => {
    const preserveVisibleCount = Math.max(0, visibleCountRef.current);
    let collected = [];
    let skip = 0;
    let pageInfo = { totalCount: 0, hasMore: false, nextSkip: null };
    let latestPlaylist = playlist;

    while (collected.length < preserveVisibleCount || (collected.length === 0 && skip === 0)) {
      const res = await getPlaylist(playlistId, { signal, take: PAGE_SIZE, skip, sort: sortBy });
      if (!res.ok) throw new Error(res.error || t("playlist.loadFailed"));
      latestPlaylist = res.data ?? latestPlaylist;
      const page = normalizeTrackPage(res.data?.tracks);
      collected = [...collected, ...page.items];
      pageInfo = page;
      if (!page.hasMore || !page.items.length) break;
      skip = Number.isFinite(Number(page.nextSkip)) ? Number(page.nextSkip) : collected.length;
    }

    const visibleItems = preserveVisibleCount > 0 ? collected.slice(0, preserveVisibleCount) : collected;
    visibleCountRef.current = visibleItems.length;
    setPlaylist((prev) => ({ ...(prev || {}), ...(latestPlaylist || {}) }));
    setTracks(visibleItems);
    setTotalCount(pageInfo.totalCount);
    setHasMore(pageInfo.hasMore || collected.length > visibleItems.length);
    const resolvedNextSkip = pageInfo.hasMore ? (Number.isFinite(Number(pageInfo.nextSkip)) ? Number(pageInfo.nextSkip) : visibleItems.length) : null;
    nextSkipRef.current = resolvedNextSkip ?? 0;
    setNextSkip(resolvedNextSkip);
    setStatus(visibleItems.length > 0 || pageInfo.totalCount > 0 ? "success" : "empty");
  }, [playlist, playlistId, sortBy, t]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (loading || !isAuth) return undefined;
    const controller = new AbortController();
    void load({ append: false, signal: controller.signal });
    return () => controller.abort();
  }, [isAuth, load, loading, playlistsVersion, sortBy]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (playsVersion <= 0 || !lastPlayEvent?.trackId) return;
    setTracks((prev) => prev.map((track) =>
      track.id === lastPlayEvent.trackId
        ? { ...track, playsCount: Number.isFinite(Number(lastPlayEvent.playsCount)) ? Number(lastPlayEvent.playsCount) : track.playsCount }
        : track
    ));
  }, [playsVersion, lastPlayEvent]);

  async function removeTrack(trackId) {
    setRemoveError("");
    setRemovingTrackId(trackId);
    try {
      const res = await removeTrackFromPlaylist(playlistId, trackId);
      if (!res.ok) {
        setRemoveError(res.error || t("playlist.removeFailed"));
        return;
      }
      notifyPlaylistsChanged();
      await reloadVisibleWindow();
    } catch {
      setRemoveError(t("playlist.removeFailed"));
    } finally {
      setRemovingTrackId(null);
    }
  }

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const sortOptions = useMemo(() => ([
    { value: "added_desc", label: t("playlist.sortRecentlyAdded") },
    { value: "added_asc", label: t("playlist.sortOldestAdded") },
    { value: "track_date_desc", label: t("playlist.sortNewestRelease") },
    { value: "plays_desc", label: t("liked.sortPopular") },
    { value: "duration_desc", label: t("liked.sortDuration") },
  ]), [t]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function playAll() {
    if (!tracks.length) return;
    p.playTrack(tracks[0], tracks);
  }

  if (status === "hard-error") {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="playlist-page"><div className="playlist-page__state">⚠ {err}</div></div>;
  }
  if (status === "loading") {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="playlist-page"><div className="playlist-page__state">{t("common.loading")}</div></div>;
  }
  if (!playlist) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="playlist-page"><div className="playlist-page__state">{t("playlist.notFound")}</div></div>;
  }

  const countBase = totalCount > 0 || tracks.length === 0 ? totalCount : tracks.length;
  const countValue = `${countBase}${hasMore ? "+" : ""}`;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="playlist-page">
      <div className="playlist-page__head">
        <div className="playlist-page__identity">
          <CoverArt src={playlist.coverUrl} title={playlist.name || t("common.playlist")} className="track-hero__cover playlist-page__cover" />
          <div className="playlist-page__meta">
            <h2 className="playlist-page__title">{playlist.name}</h2>
            <div className="playlist-page__count">{t("liked.count", { count: countBase, defaultValue: `Треків: ${countValue}` })}</div>
            <div className="playlist-page__hint">{t("playlist.manageHint")}</div>
          </div>
        </div>

        <div className="playlist-page__controls">
          <div className="playlist-page__sort">
            <span className="playlist-page__sortLabel">{t("common.sort")}:</span>
            <UiSelect value={sortBy} onChange={setSortBy} options={sortOptions} placeholder={t("common.sort")} width="100%" align="right" disabled={loadingMore || !!removingTrackId || status === "loading"} />
          </div>

          <button className="btn primary" onClick={playAll} disabled={tracks.length === 0} title={t("playlist.play")} type="button">{t("track.play")}</button>
          <button className={`icon-btn playerbar__control ${p.isShuffled ? "is-active" : ""}`} onClick={p.toggleShuffle} title={t("player.shuffle")} aria-label={t("player.shuffle")} aria-pressed={!!p.isShuffled} disabled={tracks.length === 0} type="button"><ShuffleIcon /></button>
        </div>
      </div>

      {removeError ? <div className="sp-bannerError">⚠ {removeError}</div> : null}
      {loadMoreError ? <div className="sp-bannerError">⚠ {loadMoreError}</div> : null}

      <div className="playlist-page__list">
        {!tracks.length ? (
          <div className="playlist-page__state">{t("playlist.empty")}</div>
        ) : (
          tracks.map((track) => (
            <TrackItem
              key={track.id}
              track={track}
              onPlay={() => p.playTrack(track, tracks)}
              isLiked={p.isLiked(track.id)}
              onToggleLike={() => p.toggleLike(track.id)}
              onRemove={() => removeTrack(track.id)}
            />
          ))
        )}
      </div>

      {hasMore ? (
        <div className="playlist-page__actions home__actions">
          <button className="btn" type="button" onClick={() => void load({ append: true })} disabled={loadingMore || !!removingTrackId}>
            {loadingMore ? t("common.loading") : t("common.loadMore")}
          </button>
        </div>
      ) : null}
    </div>
  );
}

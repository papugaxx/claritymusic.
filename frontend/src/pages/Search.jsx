

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ArtistAvatar from "../components/media/ArtistAvatar.jsx";
import CoverArt from "../components/media/CoverArt.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { globalSearch, MIN_SEARCH_QUERY_LENGTH } from "../services/api.js";

const FILTERS = ["all", "tracks", "artists"];

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Search() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = String(searchParams.get("q") || "");
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [query, setQuery] = useState(initialQuery);
  const [filter, setFilter] = useState("all");
  const [artists, setArtists] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const inputRef = useRef(null);
  const timerRef = useRef(null);
  const abortRef = useRef(null);
  const requestIdRef = useRef(0);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    const next = String(searchParams.get("q") || "");
    setQuery((prev) => (prev === next ? prev : next));
  }, [searchParams]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const term = String(query || "").trim();
      requestIdRef.current += 1;
      const currentRequestId = requestIdRef.current;

      if (abortRef.current) {
        abortRef.current.abort();
        abortRef.current = null;
      }

      if (!term) {
        setArtists([]);
        setTracks([]);
        setStatus("idle");
        setError("");
        setSearchParams({}, { replace: true });
        return;
      }

      setSearchParams({ q: term }, { replace: true });

      if (term.length < MIN_SEARCH_QUERY_LENGTH) {
        setArtists([]);
        setTracks([]);
        setStatus("typing");
        setError("");
        return;
      }

      const controller = new AbortController();
      abortRef.current = controller;
      setStatus("loading");
      setError("");

      try {
        const response = await globalSearch(term, { signal: controller.signal, timeoutMs: 10000 });
        if (requestIdRef.current !== currentRequestId) return;
        setArtists(Array.isArray(response?.data?.artists) ? response.data.artists : []);
        setTracks(Array.isArray(response?.data?.tracks) ? response.data.tracks : []);
        setStatus(response?.status || "success");
        setError(response?.error || "");
      } catch {
        if (controller.signal.aborted) return;
        setArtists([]);
        setTracks([]);
        setStatus("error");
        setError(t("common.genericError"));
      } finally {
        if (abortRef.current === controller) {
          abortRef.current = null;
        }
      }
    }, 220);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [query, setSearchParams, t]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => () => {
    if (abortRef.current) abortRef.current.abort();
  }, []);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const filteredTracks = useMemo(() => (filter === "artists" ? [] : tracks), [filter, tracks]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const filteredArtists = useMemo(() => (filter === "tracks" ? [] : artists), [filter, artists]);
  const hasResults = filteredTracks.length > 0 || filteredArtists.length > 0;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <section className="mobile-searchPage">
      <div className="mobile-pageHeader">
        <div>
          <h1>{t("common.search")}</h1>
        </div>
      </div>

      <div className="mobile-searchPage__field glass">
        <input
          ref={inputRef}
          className="mobile-searchPage__input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={t("common.searchPlaceholder")}
          aria-label={t("common.searchPlaceholder")}
        />
        {query ? (
          <button type="button" className="mobile-searchPage__clear" onClick={() => setQuery("")}>✕</button>
        ) : null}
      </div>

      <div className="mobile-filterRow" role="tablist" aria-label={t("common.search")}> 
        {FILTERS.map((value) => {
          const label = value === "all"
            ? t("home.all")
            : value === "tracks"
              ? t("common.tracks")
              : t("common.artists");

          // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
          return (
            <button
              key={value}
              type="button"
              className={`mobile-filterChip${filter === value ? " is-active" : ""}`}
              onClick={() => setFilter(value)}
              aria-pressed={filter === value}
            >
              {label}
            </button>
          );
        })}
      </div>

      {status === "typing" ? (
        <div className="mobile-emptyState glass">{t("common.typeMore", `Введи щонайменше ${MIN_SEARCH_QUERY_LENGTH} символи`)}</div>
      ) : null}

      {status === "loading" ? (
        <div className="mobile-emptyState glass">{t("common.searching")}</div>
      ) : null}

      {status === "error" ? (
        <div className="mobile-emptyState glass">{error || t("common.genericError")}</div>
      ) : null}

      {query.trim() && !hasResults && status !== "loading" && status !== "typing" && status !== "error" ? (
        <div className="mobile-emptyState glass">{t("common.nothingFound")}</div>
      ) : null}

      {filteredTracks.length > 0 ? (
        <section className="mobile-searchSection">
          <div className="mobile-searchSection__head">
            <h2>{t("common.tracks")}</h2>
            <span>{filteredTracks.length}</span>
          </div>
          <div className="mobile-resultList">
            {filteredTracks.map((track) => (
              <button
                key={`track-${track.id}`}
                type="button"
                className="mobile-resultCard glass"
                onClick={() => navigate(`/app/track/${track.id}`)}
              >
                <CoverArt src={track?.coverUrl} title={track?.title || t("track.titleFallback")} className="mobile-resultCard__cover" />
                <span className="mobile-resultCard__meta">
                  <strong>{track?.title || t("track.untitled")}</strong>
                  <small>{track?.artist?.name || t("common.artist")}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}

      {filteredArtists.length > 0 ? (
        <section className="mobile-searchSection">
          <div className="mobile-searchSection__head">
            <h2>{t("common.artists")}</h2>
            <span>{filteredArtists.length}</span>
          </div>
          <div className="mobile-resultList">
            {filteredArtists.map((artist) => (
              <button
                key={`artist-${artist.id || artist.name}`}
                type="button"
                className="mobile-resultCard glass"
                onClick={() => artist?.id && navigate(`/app/artists/${artist.id}`)}
              >
                <ArtistAvatar src={artist?.avatarUrl} name={artist?.name || t("common.artist")} className="mobile-resultCard__avatar" />
                <span className="mobile-resultCard__meta">
                  <strong>{artist?.name || t("common.artist")}</strong>
                  <small>{t("common.artist")}</small>
                </span>
              </button>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}

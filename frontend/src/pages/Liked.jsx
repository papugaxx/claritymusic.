

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLikedTracks } from "../services/api.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { usePlayerActions, usePlayerLikesState, usePlayerQueueState } from "../context/PlayerContext.jsx";
import TrackItem from "../components/track/TrackItem.jsx";
import UiSelect from "../components/ui/UiSelect.jsx";
import LikedCover from "../components/media/LikedCover.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { ShuffleIcon } from "../components/player/PlayerIcons.jsx";
import { useAppState } from "../context/AppStateContext.jsx";

const PAGE_SIZE = 50;

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Liked() {
  const { me, loading } = useAuth();
  const playerQueue = usePlayerQueueState();
  const playerActions = usePlayerActions();
  const playerLikes = usePlayerLikesState();
  const p = { ...playerQueue, ...playerActions, ...playerLikes };
  const { t } = useI18n();
  const { likesVersion, tracksVersion, lastPlayEvent } = useAppState();

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [tracks, setTracks] = useState([]);
  const [sortBy, setSortBy] = useState("date_desc");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");
  const [hasMore, setHasMore] = useState(false);
  const [_nextSkip, setNextSkip] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const nextSkipRef = useRef(0);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadTracks = useCallback(async ({ append = false, signal } = {}) => {
    if (!append) {
      nextSkipRef.current = 0;
      setNextSkip(0);
      setStatus("loading");
      setError("");
    } else {
      setLoadingMore(true);
    }

    const skip = append ? nextSkipRef.current : 0;

    try {
      const res = await getLikedTracks({ signal, take: PAGE_SIZE, skip });
      if (signal?.aborted) return;

      if (!res.ok) {
        if (!append) {
          nextSkipRef.current = 0;
          setTracks([]);
          setHasMore(false);
          setNextSkip(0);
          setTotalCount(0);
          setStatus("hard-error");
          setError(res.error || t("profile.loadLikedFailed"));
        } else {
          setError(res.error || t("common.loadMoreFailed"));
        }
        return;
      }

      const page = res.data || {};
      const nextItems = Array.isArray(page.items) ? page.items : [];
      const resolvedNextSkip = Number.isFinite(Number(page.nextSkip)) ? Number(page.nextSkip) : skip + nextItems.length;
      let nextVisibleCount = nextItems.length;
      setTracks((prev) => {
        const next = append ? [...prev, ...nextItems] : nextItems;
        nextVisibleCount = next.length;
        return next;
      });
      nextSkipRef.current = resolvedNextSkip;
      setHasMore(!!page.hasMore);
      setNextSkip(resolvedNextSkip);
      setTotalCount(Number.isFinite(Number(page.totalCount)) ? Number(page.totalCount) : nextVisibleCount);
      setError("");
      setStatus(nextItems.length > 0 || append || skip > 0 ? "success" : "empty");
    } catch (e) {
      if (signal?.aborted) return;
      if (!append) {
        nextSkipRef.current = 0;
        setTracks([]);
        setHasMore(false);
        setNextSkip(0);
        setTotalCount(0);
        setStatus("hard-error");
        setError(e?.message || t("profile.loadLikedFailed"));
      } else {
        setError(e?.message || t("common.loadMoreFailed"));
      }
    } finally {
      if (append) setLoadingMore(false);
    }
  }, [t]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (loading || !me?.isAuthenticated) return undefined;
    const controller = new AbortController();
    void loadTracks({ append: false, signal: controller.signal });
    return () => controller.abort();
  }, [loading, me?.isAuthenticated, likesVersion, tracksVersion, loadTracks]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const sortOptions = useMemo(() => ([
    { value: "date_desc", label: t("liked.sortNew") },
    { value: "date_asc", label: t("liked.sortOld") },
    { value: "plays_desc", label: t("liked.sortPopular") },
    { value: "duration_desc", label: t("liked.sortDuration") },
  ]), [t]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const playPatchedTracks = useMemo(() => {
    if (!lastPlayEvent?.trackId) return tracks;
    return tracks.map((track) => (
      track.id === lastPlayEvent.trackId
        ? { ...track, playsCount: Number.isFinite(Number(lastPlayEvent.playsCount)) ? Number(lastPlayEvent.playsCount) : track.playsCount }
        : track
    ));
  }, [tracks, lastPlayEvent]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const sortedTracks = useMemo(() => {
    if (!playPatchedTracks.length) return [];
    return [...playPatchedTracks].sort((a, b) => {
      switch (sortBy) {
        case "date_desc":
          return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
        case "date_asc":
          return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
        case "duration_desc":
          return (Number(b.durationSec) || 0) - (Number(a.durationSec) || 0);
        case "plays_desc":
          return (Number(b.playsCount) || 0) - (Number(a.playsCount) || 0);
        default:
          return 0;
      }
    });
  }, [playPatchedTracks, sortBy]);

  const countBase = totalCount > 0 || sortedTracks.length === 0 ? totalCount : sortedTracks.length;
  const countValue = `${countBase}${hasMore ? "+" : ""}`;
  const countText = t("liked.count", { count: countBase, defaultValue: `Треків: ${countValue}` });
  const hintText = t("liked.hint");

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function playAll() {
    if (!sortedTracks.length) return;
    p.playTrack(sortedTracks[0], sortedTracks);
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="playlist-page liked-page">
      <div className="playlist-page__head">
        <div className="playlist-page__identity">
          <LikedCover className="track-hero__cover playlist-page__cover" />
          <div className="playlist-page__meta">
            <h2 className="playlist-page__title">{t("profile.likedTracks")}</h2>
            <div className="playlist-page__count">{countText}</div>
            <div className="playlist-page__hint">{hintText}</div>
          </div>
        </div>

        <div className="playlist-page__controls">
          <div className="playlist-page__sort">
            <span className="playlist-page__sortLabel">{t("common.sort")}:</span>
            <UiSelect value={sortBy} onChange={setSortBy} options={sortOptions} placeholder={t("common.sort")} width="100%" align="right" />
          </div>

          <button className="btn primary" onClick={playAll} disabled={sortedTracks.length === 0} title={t("track.play")} type="button">
            {t("track.play")}
          </button>

          <button
            className={`icon-btn playerbar__control ${p.isShuffled ? "is-active" : ""}`}
            onClick={p.toggleShuffle}
            title={t("player.shuffle")}
            aria-label={t("player.shuffle")}
            aria-pressed={!!p.isShuffled}
            disabled={sortedTracks.length === 0}
            type="button"
          >
            <ShuffleIcon />
          </button>
        </div>
      </div>

      {status === "hard-error" ? <div className="playlist-page__state liked-page__empty">⚠ {error}</div> : null}

      {status !== "hard-error" ? (
        <>
          <div className="playlist-page__list liked-page__list">
            {sortedTracks.map((track) => (
              <TrackItem
                key={track.id}
                track={track}
                onPlay={() => p.playTrack(track, sortedTracks)}
                isLiked={true}
                onToggleLike={() => p.toggleLike(track.id)}
              />
            ))}
          </div>

          {status === "loading" ? <div className="playlist-page__state liked-page__empty">{t("common.loading")}</div> : null}
          {status === "empty" ? <div className="playlist-page__state liked-page__empty">{t("profile.noLikedTracks")}</div> : null}
          {error && status === "success" ? <div className="playlist-page__state liked-page__empty">⚠ {error}</div> : null}

          {hasMore ? (
            <div className="playlist-page__actions home__actions">
              <button className="btn" type="button" onClick={() => void loadTracks({ append: true })} disabled={loadingMore}>
                {loadingMore ? t("common.loading") : t("common.loadMore")}
              </button>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}

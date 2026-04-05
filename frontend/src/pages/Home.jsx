

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { usePlayerActions, usePlayerQueueState, usePlayerTransportState } from "../context/PlayerContext.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import ArtistAvatar from "../components/media/ArtistAvatar.jsx";
import TrackTileCard from "../components/track/TrackTileCard.jsx";
import HomeHero from "../components/home/HomeHero.jsx";
import HomeTrackSection from "../components/home/HomeTrackSection.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { useAppState } from "../context/AppStateContext.jsx";
import { useHomeData } from "../hooks/useHomeData.js";
import {
  buildFallbackMoods,
  buildFavoriteArtists,
  buildGenreOptions,
  buildHeroDescription,
  buildMoodOptions,
  enrichTrack,
  formatMinutes,
  getHomeSearchQuery,
  getTrackMoodName,
} from "../features/home/homeViewModel.js";


// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Home() {
  const playerQueue = usePlayerQueueState();
  const playerTransport = usePlayerTransportState();
  const playerActions = usePlayerActions();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const p = useMemo(() => ({ ...playerQueue, ...playerTransport, ...playerActions }), [playerActions, playerQueue, playerTransport]);
  const { t } = useI18n();
  const { playsVersion, lastPlayEvent } = useAppState();
  const { me, loading } = useAuth();
  const loc = useLocation();
  const navigate = useNavigate();

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const q = useMemo(() => getHomeSearchQuery(loc.search).trim().toLowerCase(), [loc.search]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [mood, setMood] = useState("all");
  const [genre, setGenre] = useState("all");

  
  const {
    tracks,
    setTracks,
    artists,
    moodsList,
    genresList,
    newReleaseError,
    newReleaseStatus,
    newReleaseTracks,
    recent,
    setRecent,
    recentError,
    recentLoading,
    recentStatus,
    recentTimerRef,
    refreshRecentSilent,
    browseStatus,
    browseError,
    hasMoreTracks,
    loadMoreTracks,
    loadingMoreTracks,
  } = useHomeData({
    searchQuery: q,
    moodFilter: mood,
    genreFilter: genre,
    isAuthenticated: !!me?.isAuthenticated,
  });

  
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const moveRecentToTopLocal = useCallback((trackId) => {
    setRecent((prev) => {
      if (!Array.isArray(prev) || prev.length === 0) return prev;

      const index = prev.findIndex((item) => item?.id === trackId);
      if (index < 0) return prev;

      const next = prev.slice();
      const [picked] = next.splice(index, 1);
      next.unshift(picked);
      return next;
    });
  }, [setRecent]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (playsVersion <= 0 || !lastPlayEvent?.trackId) return undefined;

    const currentId = lastPlayEvent.trackId;
    const nextCount = Number.isFinite(Number(lastPlayEvent.playsCount)) ? Number(lastPlayEvent.playsCount) : null;

    setTracks((prev) =>
      prev.map((track) => (track.id === currentId ? { ...track, playsCount: nextCount ?? track.playsCount } : track))
    );
    moveRecentToTopLocal(currentId);

    if (recentTimerRef.current) clearTimeout(recentTimerRef.current);
    recentTimerRef.current = setTimeout(() => {
      refreshRecentSilent();
    }, 350);

    return () => {
      if (recentTimerRef.current) clearTimeout(recentTimerRef.current);
    };
  }, [lastPlayEvent, moveRecentToTopLocal, playsVersion, recentTimerRef, refreshRecentSilent, setTracks]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const tracksEnriched = useMemo(
    () => tracks.map((track) => enrichTrack(track, moodsList, genresList)),
    [tracks, moodsList, genresList]
  );
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const enrichedRecent = useMemo(
    () => recent.map((track) => enrichTrack(track, moodsList, genresList)),
    [recent, moodsList, genresList]
  );
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const enrichedNewReleases = useMemo(
    () => newReleaseTracks.map((track) => enrichTrack(track, moodsList, genresList)),
    [newReleaseTracks, moodsList, genresList]
  );

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const fallbackMoods = useMemo(() => buildFallbackMoods(t), [t]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const moods = useMemo(() => buildMoodOptions(moodsList, fallbackMoods, t), [moodsList, fallbackMoods, t]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const genres = useMemo(() => buildGenreOptions(genresList, tracksEnriched, t), [genresList, tracksEnriched, t]);

  const filtered = tracksEnriched;
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const topToday = useMemo(() => filtered.slice(0, 12), [filtered]);
  const featured = topToday[0] || filtered[0] || tracksEnriched[0] || null;
  const newReleases = enrichedNewReleases;
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const favArtists = useMemo(() => buildFavoriteArtists(tracksEnriched), [tracksEnriched]);
  const selectedMoodLabel = moods.find((item) => item.id === mood)?.label || t("home.moods");

  const heroQueue = topToday.length ? topToday : filtered;
  const heroRecent = enrichedRecent[0] || null;
  const heroQueueTrack = heroRecent || featured || null;
  const heroArtist = (q ? artists : favArtists)[0] || featured?.artist || null;

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const heroPrimaryMeta = useMemo(() => {
    const meta = [];
    if (featured?.genre?.name) meta.push(featured.genre.name);
    const moodName = getTrackMoodName(featured, moodsList);
    if (moodName) meta.push(moodName);
    const duration = formatMinutes(featured?.durationSec, t);
    if (duration) meta.push(duration);
    return meta.slice(0, 3);
  }, [featured, moodsList, t]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const heroDescription = useMemo(() => buildHeroDescription({
    featured,
    mood,
    selectedMoodLabel,
    t,
  }), [featured, mood, selectedMoodLabel, t]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const playFromHome = useCallback((event, track, queue = null) => {
    event?.preventDefault?.();
    event?.stopPropagation?.();
    if (loading || !track) return;

    const isCurrentTrack = Number(p.currentTrack?.id) === Number(track.id);
    if (isCurrentTrack) {
      void p.togglePlayPause();
      return;
    }

    void p.playTrack(track, Array.isArray(queue) && queue.length ? queue : [track]);
  }, [loading, p]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const renderTrackTile = useCallback((track, queue = null) => {
    if (!track) return null;
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <TrackTileCard key={track.id} track={track} queue={queue} subtitle={track.artist?.name || ""} />;
  }, []);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="home">
      <div className="home__content">
        <HomeHero
          t={t}
          moods={moods}
          mood={mood}
          setMood={setMood}
          genres={genres}
          genre={genre}
          setGenre={setGenre}
          featured={featured}
          heroDescription={heroDescription}
          heroPrimaryMeta={heroPrimaryMeta}
          playFromHome={playFromHome}
          heroQueue={heroQueue}
          loading={loading}
          heroRecent={heroRecent}
          playTrack={p.playTrack}
          recent={recent}
          heroQueueTrack={heroQueueTrack}
          me={me}
          heroArtist={heroArtist}
          navigate={navigate}
        />

        <HomeTrackSection
          title={t("home.todayMusic")}
          status={browseStatus}
          error={browseError || t("home.loadFailed")}
          emptyText={q || mood !== "all" || genre !== "all" ? t("common.nothingFound") : t("home.noTracksYet")}
          items={browseStatus !== "hard-error" ? topToday.slice(0, 10) : []}
          renderItem={(track) => renderTrackTile(track, topToday)}
        />

        <HomeTrackSection
          title={t("home.newReleases")}
          status={newReleaseStatus}
          error={newReleaseError || t("home.loadFailed")}
          emptyText={t("home.noTracksYet")}
          items={newReleaseStatus !== "hard-error" ? newReleases : []}
          renderItem={(track) => renderTrackTile(track, newReleases)}
          actions={hasMoreTracks ? (
            <div className="home__actions">
              <button className="btn" type="button" onClick={() => void loadMoreTracks()} disabled={loadingMoreTracks}>
                {loadingMoreTracks ? t("common.loading") : t("common.loadMore")}
              </button>
            </div>
          ) : null}
        />

        <div className="home__sectionHead">
          <div className="home__title">{t("home.favoriteArtists")}</div>
        </div>

        <div className="home__card glass">
          <div className="artists">
            {favArtists.slice(0, 8).map((artist) => (
              <button
                key={artist?.id ?? artist?.name}
                className={`artist ${artist?.id ? "is-clickable" : "is-disabled"}`}
                onClick={() => artist?.id && navigate(`/app/artists/${artist.id}`)}
                title={t("home.openArtist")}
                type="button"
                disabled={!artist?.id}
              >
                <ArtistAvatar src={artist?.avatarUrl} name={artist?.name || "Artist"} className="artist__avatar" />
                <div className="artist__name">{artist?.name || ""}</div>
              </button>
            ))}
          </div>
        </div>

        {!q && me?.isAuthenticated ? (
          <>
            <div className="home__sectionHead">
              <div className="home__title">{t("home.recentlyPlayed")}</div>
            </div>
            <div className="home__card glass">
              {recentLoading || recentStatus === "loading" ? <div className="home__mutedState">{t("home.loading")}</div> : null}
              {recentStatus === "hard-error" ? <div className="home__mutedState">{recentError || t("home.loadFailed")}</div> : null}
              {!recentLoading && recentStatus !== "hard-error" && recent.length === 0 ? <div className="home__mutedState">{t("home.recentEmpty")}</div> : null}
              {!recentLoading && recentStatus !== "hard-error" && recent.length > 0 ? (
                <div className="row">
                  {enrichedRecent.map((track) => renderTrackTile(track, enrichedRecent))}
                </div>
              ) : null}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}

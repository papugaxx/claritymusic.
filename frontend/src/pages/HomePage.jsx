

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Chip } from "../ui/Chip.jsx";
import { Surface } from "../ui/Surface.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { AvatarArt } from "../ui/AvatarArt.jsx";
import { getArtists, getLookups, getRecentTracks, getTracks } from "../services/api.js";
import { useShell } from "../contexts/ShellContext.jsx";
import { usePlayer } from "../contexts/PlayerContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function formatMinutes(value) {
  const total = Number(value || 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  const minutes = Math.max(1, Math.round(total / 60));
  return `${minutes} min`;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function pickTrackMeta(track) {
  const items = [];
  if (track?.genreName || track?.genre?.name) items.push(track.genreName || track.genre?.name);
  if (track?.moodName || track?.mood?.name) items.push(track.moodName || track.mood?.name);
  const minutes = formatMinutes(track?.durationSec);
  if (minutes) items.push(minutes);
  return items;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function uniqueArtists(...trackLists) {
  const map = new Map();
  trackLists.flat().forEach((track) => {
    const artistId = track?.artistId || track?.artist?.id;
    const artistName = track?.artistName || track?.artist?.name;
    if (!artistId || !artistName || map.has(Number(artistId))) return;
    map.set(Number(artistId), {
      id: Number(artistId),
      name: artistName,
      avatarUrl: track?.artist?.avatarUrl || "",
      coverUrl: track?.artist?.coverUrl || "",
    });
  });
  return Array.from(map.values());
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function TrackRail({ items, onPlay, emptyText = "Nothing to show yet.", title = "" }) {
  if (!items.length) return <Surface className="homeRailSurface"><div className="emptyState">{emptyText}</div></Surface>;
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <Surface className="homeRailSurface">
      <div className="homeRail" data-title={title}>
        {items.map((track, index) => (
          <article key={`${title}-${track.id}`} className="homeRailCard">
            <button type="button" className="homeRailCard__mediaButton" onClick={() => onPlay(items, index)}>
              <CoverArt src={track.coverUrl} title={track.title} className="homeRailCard__cover" />
            </button>
            <button type="button" className="homeRailCard__textButton" onClick={() => onPlay(items, index)}>
              <strong>{track.title}</strong>
              <span>{track.artistName || track.artist?.name || "—"}</span>
            </button>
          </article>
        ))}
      </div>
    </Surface>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function ArtistRail({ items }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <Surface className="homeRailSurface homeRailSurface--artists">
      <div className="artistRail artistRail--compact artistRail--plain">
        {items.length ? items.map((artist) => (
          <Link key={artist.id || artist.name} to={artist.id ? `/app/artists/${artist.id}` : "/app"} className="artistRail__item artistRail__item--compact artistRail__item--plain">
            <AvatarArt src={artist.avatarUrl} name={artist.name} className="artistRail__avatar artistRail__avatar--small" />
            <div className="artistRail__copy">
              <strong>{artist.name}</strong>
            </div>
          </Link>
        )) : <div className="emptyState">No artists to show yet.</div>}
      </div>
    </Surface>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function HomePage() {
  const { searchQuery, moodFilter, setMoodFilter, genreFilter, setGenreFilter } = useShell();
  const { playQueue, playTrack } = usePlayer();
  const { me } = useAuth();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [lookups, setLookups] = useState({ moods: [], genres: [] });
  const [tracks, setTracks] = useState([]);
  const [recent, setRecent] = useState([]);
  const [newReleases, setNewReleases] = useState([]);
  const [artists, setArtists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [recentStatus, setRecentStatus] = useState("idle");

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    getLookups().then((response) => {
      if (!alive) return;
      setLookups(response.ok ? response.data : { moods: [], genres: [] });
    });
    return () => {
      alive = false;
    };
  }, []);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    setLoading(true);

    Promise.all([
      getTracks({
        q: searchQuery || undefined,
        genreId: genreFilter === "all" ? undefined : genreFilter,
        moodId: moodFilter === "all" ? undefined : moodFilter,
        sort: searchQuery ? "title" : "popular",
        take: 12,
        skip: 0,
      }),
      getTracks({
        q: searchQuery || undefined,
        genreId: genreFilter === "all" ? undefined : genreFilter,
        moodId: moodFilter === "all" ? undefined : moodFilter,
        sort: "new",
        take: 8,
        skip: 0,
      }),
      getArtists(searchQuery || "", { take: 8 }),
    ]).then(([tracksResponse, releasesResponse, artistsResponse]) => {
      if (!alive) return;
      const nextTracks = tracksResponse.ok ? tracksResponse.data.items || [] : [];
      const nextReleases = releasesResponse.ok ? releasesResponse.data.items || [] : [];
      const remoteArtists = artistsResponse.ok ? artistsResponse.data || [] : [];

      setTracks(nextTracks);
      setNewReleases(nextReleases);
      setArtists(remoteArtists.length ? remoteArtists : uniqueArtists(nextTracks, nextReleases));
      setLoading(false);
    });

    return () => {
      alive = false;
    };
  }, [searchQuery, genreFilter, moodFilter]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    if (!me?.isAuthenticated) {
      setRecent([]);
      setRecentStatus("idle");
      return undefined;
    }

    setRecentStatus("loading");
    getRecentTracks(8).then((response) => {
      if (!alive) return;
      setRecent(response.ok ? response.data || [] : []);
      setRecentStatus(response.ok ? "success" : "error");
    });

    return () => {
      alive = false;
    };
  }, [me?.isAuthenticated]);

  const featured = tracks[0] || recent[0] || newReleases[0] || null;
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const heroMeta = useMemo(() => pickTrackMeta(featured), [featured]);
  const heroQueueTrack = recent[0] || featured || null;
  const highlightArtist = artists[0] || featured?.artist || null;
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const favoriteArtists = useMemo(() => {
    if (artists.length) return artists.slice(0, 10);
    return uniqueArtists(tracks, newReleases, recent).slice(0, 10);
  }, [artists, tracks, newReleases, recent]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function handlePlayQueue(items, index) {
    if (!items?.length) return;
    playQueue(items, index);
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="pageStack pageStack--home">
      <Surface className="homeHero">
        <div className="homeFilterGroup">
          <strong>Moods</strong>
          <div className="chipRow">
            <Chip active={moodFilter === "all"} onClick={() => setMoodFilter("all")}>All</Chip>
            {lookups.moods.slice(0, 6).map((mood) => (
              <Chip key={mood.id} active={String(mood.id) === String(moodFilter)} onClick={() => setMoodFilter(String(mood.id))}>
                {mood.name}
              </Chip>
            ))}
          </div>
        </div>

        <div className="homeHero__layout">
          <Surface className="featuredCard">
            <div className="featuredCard__head">
              <span className="badge featuredCard__badge">FEATURED</span>
            </div>
            <div className="featuredCard__body">
              <div className="featuredCard__coverSlot">
                <CoverArt src={featured?.coverUrl} title={featured?.title || "Featured track"} className="featuredCard__cover" />
              </div>
              <div className="featuredCard__meta">
                <h1>{featured?.title || "Featured track"}</h1>
                <h3>{featured?.artistName || featured?.artist?.name || "Featured artist"}</h3>
                <p>Now in focus: {featured?.title || "Featured track"} — {featured?.artistName || featured?.artist?.name || "Featured artist"}.</p>
                <div className="chipRow chipRow--tight">
                  {heroMeta.length ? heroMeta.map((item) => <Chip key={item}>{item}</Chip>) : <Chip>Electronic</Chip>}
                  <button type="button" className="primaryButton primaryButton--compact" onClick={() => featured && playTrack(featured, tracks.length ? tracks : [featured])}>Play</button>
                </div>
              </div>
            </div>
          </Surface>

          <div className="homeHero__aside">
            <button
              type="button"
              className="homeSideCard surface"
              onClick={() => heroQueueTrack && playTrack(heroQueueTrack, recent.length ? recent : tracks.length ? tracks : [heroQueueTrack])}
              disabled={!heroQueueTrack}
            >
              <span className="homeSideCard__eyebrow">CONTINUE LISTENING</span>
              <div className="homeSideCard__row">
                <CoverArt src={heroQueueTrack?.coverUrl} title={heroQueueTrack?.title || "Featured track"} className="homeSideCard__media" />
                <div className="homeSideCard__content">
                  <strong>{heroQueueTrack?.title || "Featured track"}</strong>
                  <span>{heroQueueTrack?.artistName || heroQueueTrack?.artist?.name || "Featured artist"}</span>
                </div>
              </div>
            </button>

            {highlightArtist?.id ? (
              <Link to={`/app/artists/${highlightArtist.id}`} className="homeSideCard surface homeSideCard--link">
                <span className="homeSideCard__eyebrow">ARTIST HIGHLIGHT</span>
                <div className="homeSideCard__row">
                  <AvatarArt src={highlightArtist?.avatarUrl} name={highlightArtist?.name || "Featured artist"} className="homeSideCard__avatar" />
                  <div className="homeSideCard__content">
                    <strong>{highlightArtist.name}</strong>
                    <span>Open artist profile</span>
                  </div>
                </div>
              </Link>
            ) : (
              <Surface className="homeSideCard">
                <span className="homeSideCard__eyebrow">ARTIST HIGHLIGHT</span>
                <div className="homeSideCard__row">
                  <AvatarArt src={highlightArtist?.avatarUrl} name={highlightArtist?.name || "Featured artist"} className="homeSideCard__avatar" />
                  <div className="homeSideCard__content">
                    <strong>{highlightArtist?.name || "Featured artist"}</strong>
                    <span>Stay in your music space</span>
                  </div>
                </div>
              </Surface>
            )}
          </div>
        </div>

        <div className="homeFilterGroup homeFilterGroup--bottom">
          <strong>Genres</strong>
          <div className="chipRow">
            <Chip active={genreFilter === "all"} onClick={() => setGenreFilter("all")}>All</Chip>
            {lookups.genres.slice(0, 6).map((genre) => (
              <Chip key={genre.id} active={String(genre.id) === String(genreFilter)} onClick={() => setGenreFilter(String(genre.id))}>
                {genre.name}
              </Chip>
            ))}
          </div>
        </div>
      </Surface>

      <div className="homeSectionHead">
        <h2 className="sectionTitle">Your music today</h2>
      </div>
      {loading ? <Surface className="homeRailSurface"><div className="emptyState">Loading…</div></Surface> : <TrackRail items={tracks} onPlay={handlePlayQueue} title="today" />}

      <div className="homeSectionHead">
        <h3 className="homeSectionHead__title">New releases</h3>
      </div>
      {loading ? <Surface className="homeRailSurface"><div className="emptyState">Loading…</div></Surface> : <TrackRail items={newReleases} onPlay={handlePlayQueue} title="releases" />}

      <div className="homeSectionHead">
        <h3 className="homeSectionHead__title">Favorite artists</h3>
      </div>
      <ArtistRail items={favoriteArtists} />

      {me?.isAuthenticated ? (
        <>
          <div className="homeSectionHead">
            <h3 className="homeSectionHead__title">Recently played</h3>
            {recent.length ? <button type="button" className="ghostButton" onClick={() => playTrack(recent[0], recent)}>Open latest</button> : null}
          </div>
          {recentStatus === "loading" ? <Surface className="homeRailSurface"><div className="emptyState">Loading…</div></Surface> : <TrackRail items={recent} onPlay={handlePlayQueue} title="recent" />}
        </>
      ) : null}
    </div>
  );
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getArtist, getTrack } from "../services/api.js";
import { usePlayer } from "../contexts/PlayerContext.jsx";
import { useShell } from "../contexts/ShellContext.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { AvatarArt } from "../ui/AvatarArt.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function formatNumber(value) {
  const numeric = Number(value || 0);
  if (!Number.isFinite(numeric)) return "0";
  if (numeric >= 1000) return `${(numeric / 1000).toFixed(1)}K`;
  return String(numeric);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function mergeTrack(baseTrack, remoteTrack) {
  if (!remoteTrack?.id || Number(remoteTrack.id) !== Number(baseTrack?.id)) return baseTrack;
  return {
    ...baseTrack,
    ...remoteTrack,
    artist: remoteTrack.artist || baseTrack.artist,
    genre: remoteTrack.genre || baseTrack.genre,
    mood: remoteTrack.mood || baseTrack.mood,
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function mergeArtist(baseArtist, remoteArtist, fallbackName, fallbackId) {
  if (!remoteArtist?.id || Number(remoteArtist.id) !== Number(fallbackId)) {
    return {
      ...(baseArtist || {}),
      id: fallbackId || baseArtist?.id || null,
      name: baseArtist?.name || fallbackName || "Artist",
    };
  }
  return {
    ...(baseArtist || {}),
    ...remoteArtist,
    name: remoteArtist.name || baseArtist?.name || fallbackName || "Artist",
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function getNextQueueTrack(queue, currentIndex, currentId) {
  if (!Array.isArray(queue) || !queue.length) return null;
  const nextIndex = currentIndex + 1;
  if (nextIndex >= queue.length) return null;
  const nextTrack = queue[nextIndex];
  if (!nextTrack || Number(nextTrack.id) === Number(currentId)) return null;
  return nextTrack;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function RightPanel() {
  const navigate = useNavigate();
  const { currentTrack, queue, index, playTrack } = usePlayer();
  const { setRightPanelOpen } = useShell();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [remoteTrack, setRemoteTrack] = useState(null);
  const [remoteArtist, setRemoteArtist] = useState(null);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!currentTrack?.id) {
      setRemoteTrack(null);
      setRemoteArtist(null);
      return undefined;
    }

    let alive = true;
    Promise.all([
      getTrack(currentTrack.id),
      currentTrack.artistId ? getArtist(currentTrack.artistId) : Promise.resolve({ ok: false }),
    ]).then(([trackResponse, artistResponse]) => {
      if (!alive) return;
      setRemoteTrack(trackResponse?.ok ? trackResponse.data : null);
      setRemoteArtist(artistResponse?.ok ? artistResponse.data : null);
    });

    return () => {
      alive = false;
    };
  }, [currentTrack?.id, currentTrack?.artistId]);

  const nextTrack = getNextQueueTrack(queue, index, currentTrack?.id);

  if (!currentTrack) return null;

  const resolvedTrack = mergeTrack(currentTrack, remoteTrack);
  const resolvedArtist = mergeArtist(
    resolvedTrack.artist,
    remoteArtist,
    resolvedTrack.artistName || resolvedTrack.artist?.name,
    resolvedTrack.artistId || resolvedTrack.artist?.id,
  );

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <aside className="rightPanel">
      <div className="rightPanel__header">
        <h3>Now playing</h3>
        <button type="button" className="iconButton iconButton--bare rightPanel__closeButton" onClick={() => setRightPanelOpen(false)} aria-label="Close now playing panel">
          ×
        </button>
      </div>

      <CoverArt src={resolvedTrack.coverUrl} title={resolvedTrack.title} className="rightPanel__cover" />

      <div className="rightPanel__meta">
        <strong>{resolvedTrack.title}</strong>
        <button type="button" className="rightPanel__artistLink" onClick={() => navigate(resolvedArtist.id ? `/app/artists/${resolvedArtist.id}` : `/app/track/${resolvedTrack.id}`)}>
          {resolvedArtist.name || "—"}
        </button>
      </div>

      <section className="rightPanel__section surfaceCardLike">
        <div className="rightPanel__sectionTitle">About the artist</div>
        <Link to={resolvedArtist.id ? `/app/artists/${resolvedArtist.id}` : "/app"} className="artistMiniCard">
          <AvatarArt src={resolvedArtist.avatarUrl} name={resolvedArtist.name || "Artist"} className="artistMiniCard__avatar" />
          <span className="artistMiniCard__text">
            <strong>{resolvedArtist.name || "Artist"}</strong>
            <span>View artist</span>
          </span>
        </Link>
      </section>

      <section className="rightPanel__section surfaceCardLike">
        <div className="rightPanel__sectionTitle">Credits</div>
        <div className="creditRow"><span>Main artist</span><strong>{resolvedArtist.name || "—"}</strong></div>
        <div className="creditRow"><span>Genre</span><strong>{resolvedTrack.genreName || resolvedTrack.genre?.name || "—"}</strong></div>
        <div className="creditRow"><span>Mood</span><strong>{resolvedTrack.moodName || resolvedTrack.mood?.name || "—"}</strong></div>
      </section>

      <section className="rightPanel__section surfaceCardLike">
        <div className="rightPanel__sectionTitle">Next in queue</div>
        {nextTrack ? (
          <button type="button" className="artistMiniCard rightPanel__queueCard" onClick={() => playTrack(nextTrack, queue)}>
            <CoverArt src={nextTrack.coverUrl} title={nextTrack.title} className="artistMiniCard__avatar" />
            <span className="artistMiniCard__text">
              <strong>{nextTrack.title}</strong>
              <span>{nextTrack.artistName || nextTrack.artist?.name || "Open track"}</span>
            </span>
          </button>
        ) : (
          <div className="emptyState">No next track in queue.</div>
        )}
      </section>
    </aside>
  );
}

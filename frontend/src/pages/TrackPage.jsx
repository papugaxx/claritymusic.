

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { addTrackToPlaylist, getPlaylists, getTrack, playlistHasTrack } from "../services/api.js";
import { Surface } from "../ui/Surface.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { SelectField } from "../ui/SelectField.jsx";
import { usePlayer } from "../contexts/PlayerContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function fmt(value) {
  const total = Math.max(0, Math.floor(Number(value || 0)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function TrackPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { me } = useAuth();
  const { playTrack, toggleLike, isLiked } = usePlayer();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [track, setTrack] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [selectedPlaylist, setSelectedPlaylist] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);
  const [loading, setLoading] = useState(true);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    setLoading(true);
    getTrack(id).then((response) => {
      if (!alive) return;
      setTrack(response.ok ? response.data : null);
      setLoading(false);
    });

    if (me?.isAuthenticated) {
      getPlaylists().then((response) => {
        if (!alive) return;
        setPlaylists(response.ok ? response.data || [] : []);
      });
    } else {
      setPlaylists([]);
    }

    return () => {
      alive = false;
    };
  }, [id, me?.isAuthenticated]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    setMessage("");
    setAlreadyIn(false);
    if (!selectedPlaylist || !track?.id || !me?.isAuthenticated) return undefined;
    setChecking(true);
    playlistHasTrack(selectedPlaylist, track.id).then((response) => {
      if (!alive) return;
      setAlreadyIn(Boolean(response?.ok && response?.data?.exists));
      setChecking(false);
    });
    return () => {
      alive = false;
    };
  }, [selectedPlaylist, track?.id, me?.isAuthenticated]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const playlistOptions = useMemo(() => playlists.map((playlist) => ({ value: String(playlist.id), label: playlist.name })), [playlists]);

  async function handleLike() {
    if (!track?.id) return;
    if (!me?.isAuthenticated) {
      navigate("/login");
      return;
    }
    await toggleLike(track.id);
  }

  async function handleAddToPlaylist() {
    if (!selectedPlaylist || !track?.id) return;
    if (!me?.isAuthenticated) {
      navigate("/login");
      return;
    }
    if (alreadyIn) {
      setMessage("Already in this playlist");
      return;
    }
    const response = await addTrackToPlaylist(selectedPlaylist, track.id);
    setMessage(response.ok ? "Added to playlist." : (response.error || "Failed to add track"));
    if (response.ok) setAlreadyIn(true);
  }

  if (loading) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="pageStack"><Surface className="listSurface"><div className="emptyState">Loading…</div></Surface></div>;
  }

  if (!track) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="pageStack"><Surface className="listSurface"><div className="emptyState">Track not found.</div></Surface></div>;
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="pageStack">
      <Surface className="trackHero">
        <div className="trackHero__lead">
          <CoverArt src={track.coverUrl} title={track.title} className="trackHero__cover" />
          <div className="trackHero__meta">
            <h1>{track.title}</h1>
            <span>{track.artistName || track.artist?.name || "Artist"}</span>
            <p>
              Genre: {track.genreName || track.genre?.name || "—"}
              {" • "}
              Mood: {track.moodName || track.mood?.name || "—"}
              {" • "}
              Duration: {fmt(track.durationSec)}
              {" • "}
              Plays: {track.playsCount || 0}
            </p>
            <div className="buttonRow">
              <button type="button" className="primaryButton primaryButton--compact" onClick={() => playTrack(track, [track])}>Play</button>
              <button type="button" className="ghostButton" onClick={handleLike}>{isLiked(track.id) ? "Remove from liked" : "Add to liked"}</button>
            </div>
          </div>
        </div>

        <div className="trackPlaylistPanel">
          <div className="trackPlaylistPanel__label">Add to playlist</div>
          {me?.isAuthenticated ? (
            <div className="trackPlaylistPanel__row">
              <SelectField value={selectedPlaylist} onChange={setSelectedPlaylist} options={playlistOptions} placeholder="Select playlist" />
              <button type="button" className="ghostButton" onClick={handleAddToPlaylist} disabled={!selectedPlaylist || checking}>{checking ? "Checking…" : alreadyIn ? "Already added" : "Add"}</button>
            </div>
          ) : (
            <div className="inlineMessage">Log in to like and add this track to your playlists.</div>
          )}
          {message ? <div className="inlineMessage">{message}</div> : null}
        </div>
      </Surface>
    </div>
  );
}

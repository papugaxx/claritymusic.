

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { addTrackToPlaylist, getPlaylists, playlistHasTrack } from "../services/api.js";
import { useShell } from "../contexts/ShellContext.jsx";
import { usePlayer } from "../contexts/PlayerContext.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";
import { CoverArt } from "../ui/CoverArt.jsx";
import { SelectField } from "../ui/SelectField.jsx";
import { MenuPopover, MenuItem, useLayerDismiss, usePopoverStyle } from "../ui/MenuPopover.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function fmt(value) {
  const total = Math.max(0, Math.floor(Number(value || 0)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function percent(value, max) {
  if (!Number.isFinite(Number(value)) || !Number.isFinite(Number(max)) || Number(max) <= 0) return 0;
  return Math.min(100, Math.max(0, (Number(value) / Number(max)) * 100));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function PlayerBar() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const { toggleRightPanel } = useShell();
  const {
    queue,
    currentTrack,
    isPlaying,
    position,
    duration,
    volume,
    isShuffled,
    repeatOne,
    togglePlayPause,
    next,
    prev,
    seek,
    setVolume,
    toggleLike,
    isLiked,
    toggleShuffle,
    toggleRepeatOne,
  } = usePlayer();

  const menuAnchorRef = useRef(null);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistId, setPlaylistId] = useState("");
  const [checking, setChecking] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);
  const [message, setMessage] = useState("");
  const { style: menuStyle, menuRef } = usePopoverStyle(menuOpen, menuAnchorRef, {
    align: "right",
    side: "auto",
    minWidth: 268,
    maxWidth: 284,
    width: 272,
    estimatedHeight: 250,
  });

  useLayerDismiss(menuOpen, [menuAnchorRef, menuRef], () => setMenuOpen(false));

  const progressPercent = percent(position, duration);
  const volumePercent = percent(volume, 1);
  const liked = currentTrack?.id ? isLiked(currentTrack.id) : false;
  const canControl = !!currentTrack || queue.length > 0;

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    if (!menuOpen || !me?.isAuthenticated) return undefined;
    getPlaylists().then((response) => {
      if (!alive) return;
      setPlaylists(response?.ok ? response.data || [] : []);
    });
    return () => {
      alive = false;
    };
  }, [menuOpen, me?.isAuthenticated]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    setMessage("");
    setAlreadyIn(false);
    if (!playlistId || !currentTrack?.id || !menuOpen || !me?.isAuthenticated) return undefined;

    setChecking(true);
    playlistHasTrack(playlistId, currentTrack.id).then((response) => {
      if (!alive) return;
      setAlreadyIn(Boolean(response?.ok && response?.data?.exists));
      setChecking(false);
    });

    return () => {
      alive = false;
    };
  }, [playlistId, currentTrack?.id, menuOpen, me?.isAuthenticated]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const playlistOptions = useMemo(() => playlists.map((playlist) => ({ value: String(playlist.id), label: playlist.name })), [playlists]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    setMenuOpen(false);
    setPlaylistId("");
    setMessage("");
    setAlreadyIn(false);
  }, [currentTrack?.id]);

  async function handleToggleLike() {
    if (!currentTrack?.id) return;
    if (!me?.isAuthenticated) {
      navigate("/login");
      return;
    }
    await toggleLike(currentTrack.id);
  }

  async function handleAddToPlaylist() {
    if (!currentTrack?.id || !playlistId) return;
    if (!me?.isAuthenticated) {
      navigate("/login");
      return;
    }
    if (alreadyIn) {
      setMessage("Already in this playlist");
      return;
    }
    const response = await addTrackToPlaylist(playlistId, currentTrack.id);
    if (!response?.ok) {
      setMessage(response?.error || "Failed to add track");
      return;
    }
    setAlreadyIn(true);
    setMessage("Track added ✅");
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <footer className={`playerBar surface ${currentTrack ? "" : "is-empty"}`.trim()}>
      <div className="playerBar__left">
        <CoverArt
          src={currentTrack?.coverUrl}
          title={currentTrack?.title || "Nothing playing"}
          className="playerBar__cover"
          onClick={currentTrack?.id ? () => navigate(`/app/track/${currentTrack.id}`) : null}
        />
        <div className="playerBar__meta">
          <button type="button" className="playerBar__trackLink" onClick={() => currentTrack?.id && navigate(`/app/track/${currentTrack.id}`)} disabled={!currentTrack?.id}>
            {currentTrack?.title || "Nothing playing"}
          </button>
          <div className="playerBar__artist">{currentTrack?.artistName || currentTrack?.artist?.name || "Choose a track to start listening"}</div>
        </div>
      </div>

      <div className="playerBar__center">
        <div className="playerBar__controls">
          <button type="button" className={`actionButton ${isShuffled ? "is-active" : ""}`.trim()} onClick={toggleShuffle} disabled={!canControl} aria-pressed={isShuffled}>⇄</button>
          <button type="button" className="actionButton" onClick={prev} disabled={!currentTrack}>⏮</button>
          <button type="button" className="playerBar__playButton" onClick={togglePlayPause} disabled={!canControl}>{isPlaying ? "❚❚" : "▶"}</button>
          <button type="button" className="actionButton" onClick={next} disabled={!currentTrack}>⏭</button>
          <button type="button" className={`actionButton ${repeatOne ? "is-active" : ""}`.trim()} onClick={toggleRepeatOne} disabled={!canControl} aria-pressed={repeatOne}>↻</button>
        </div>

        <div className="playerBar__timeline">
          <span>{fmt(position)}</span>
          <input
            type="range"
            min="0"
            max={Math.max(1, duration || 1)}
            step="0.1"
            value={Math.min(position, duration || 1)}
            onChange={(event) => seek(event.target.value)}
            disabled={!currentTrack}
            style={{ "--range-progress": `${progressPercent}%` }}
          />
          <span>{fmt(duration)}</span>
        </div>
      </div>

      <div className="playerBar__right">
        <button type="button" className={`actionButton ${liked ? "is-active" : ""}`.trim()} onClick={handleToggleLike} disabled={!currentTrack}>♥</button>
        <button type="button" className="actionButton" onClick={toggleRightPanel} disabled={!currentTrack}>☰</button>
        <div className="playerBar__volumeWrap">
          <span>🔉</span>
          <input type="range" min="0" max="1" step="0.01" value={volume} onChange={(event) => setVolume(event.target.value)} style={{ "--range-progress": `${volumePercent}%` }} />
        </div>
        <button ref={menuAnchorRef} type="button" className="actionButton" onClick={() => setMenuOpen((value) => !value)} disabled={!currentTrack}>⋯</button>

        <MenuPopover open={menuOpen && Boolean(currentTrack)} style={menuStyle} menuRef={menuRef}>
          <div className="playerBar__menuTitle">Add to playlist</div>
          <SelectField value={playlistId} onChange={setPlaylistId} options={playlistOptions} placeholder="Select playlist" />
          <div className="playerBar__menuActions">
            <button type="button" className="primaryButton" onClick={handleAddToPlaylist} disabled={!playlistId || checking}>{checking ? "Checking…" : alreadyIn ? "Already added" : "Add"}</button>
            <button type="button" className="ghostButton" onClick={() => setMenuOpen(false)}>Close</button>
          </div>
          {message ? <div className="inlineMessage">{message}</div> : null}
        </MenuPopover>
      </div>
    </footer>
  );
}

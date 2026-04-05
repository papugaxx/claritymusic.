

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlayerActions, usePlayerLikesState, usePlayerQueueState, usePlayerTransportState } from "../../context/PlayerContext.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { addTrackToPlaylistSafely, fetchSelectablePlaylists, resolvePlaylistTrackMembership } from "../../services/playlistMutations.js";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import CoverArt from "../media/CoverArt.jsx";
import UiSelect from "../ui/UiSelect.jsx";
import { formatSeconds } from "../../utils/audio.js";
import {
  DotsIcon,
  HeartIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  QueueIcon,
  RepeatOneIcon,
  ShuffleIcon,
  VolumeHighIcon,
} from "./PlayerIcons.jsx";

const PHONE_BREAKPOINT = 767;

// Функція нижче інкапсулює окрему частину логіки цього модуля
function percent(value, max) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function PlayerBar() {
  const nav = useNavigate();
  const playerQueue = usePlayerQueueState();
  const playerTransport = usePlayerTransportState();
  const playerActions = usePlayerActions();
  const playerLikes = usePlayerLikesState();
  const p = { ...playerQueue, ...playerTransport, ...playerActions, ...playerLikes };
  const { me, loading } = useAuth();
  const { toggleRightPanel, setRightPanelOpen, notifyPlaylistsChanged } = useAppState();
  const { t } = useI18n();
  const isAuth = !!me?.isAuthenticated;

  const track = p.currentTrack;
  const progressPercent = percent(Number(p.position || 0), Number(p.duration || 0));
  const volumePercent = Math.min(100, Math.max(0, Number(p.volume || 0) * 100));

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") return 1280;
    return window.innerWidth;
  });
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [menuOpen, setMenuOpen] = useState(false);
  const [playlists, setPlaylists] = useState([]);
  const [playlistId, setPlaylistId] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [likePending, setLikePending] = useState(false);

  const rootRef = useRef(null);

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    // Нижче оголошено обробник який реагує на дію користувача і змінює стан
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ефект підписує компонент на зовнішні події і знімає підписку під час очищення
  useEffect(() => {
    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onDoc(event) {
      if (event.target?.closest?.(".profile-dropdown")) return;
      if (!rootRef.current) return;
      if (!rootRef.current.contains(event.target)) setMenuOpen(false);
    }

    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, []);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!loading && isAuth && menuOpen) {
      loadPlaylists();
    }
  }, [loading, isAuth, menuOpen]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    let alive = true;

    async function checkCurrentPlaylist() {
      setAlreadyIn(false);
      setMessage("");

      if (!menuOpen || !playlistId || !track?.id || !isAuth) return;

      setChecking(true);
      try {
        const res = await resolvePlaylistTrackMembership(playlistId, track.id);
        if (!alive) return;
        if (!res.ok) {
          setAlreadyIn(false);
          return;
        }
        setAlreadyIn(Boolean(res.exists));
      } finally {
        if (alive) setChecking(false);
      }
    }

    checkCurrentPlaylist();

    return () => {
      alive = false;
    };
  }, [menuOpen, playlistId, track?.id, isAuth]);

  async function loadPlaylists() {
    try {
      setPlaylists(await fetchSelectablePlaylists());
    } catch {
      setPlaylists([]);
    }
  }

  async function addToPlaylist() {
    if (!track?.id || !playlistId || addingToPlaylist) return;
    if (!isAuth) {
      nav("/login");
      return;
    }

    setMessage("");
    if (alreadyIn) {
      setMessage(t("track.alreadyInPlaylist"));
      return;
    }

    setAddingToPlaylist(true);
    try {
      const res = await addTrackToPlaylistSafely(playlistId, track.id);
      if (!res.ok) {
        setMessage(res?.error || t("track.addFailed"));
        return;
      }

      if (res.alreadyExists) {
        setAlreadyIn(true);
        setMessage(t("track.alreadyInPlaylist"));
        return;
      }

      setMessage(t("track.addedTrack"));
      setAlreadyIn(true);
      notifyPlaylistsChanged();
    } catch {
      setMessage(t("track.addFailed"));
    } finally {
      setAddingToPlaylist(false);
    }
  }

  async function onToggleLike() {
    if (!track?.id || likePending) return;
    if (!isAuth) {
      nav("/login");
      return;
    }

    setLikePending(true);
    try {
      await p.toggleLike(track.id);
    } finally {
      setLikePending(false);
    }
  }

  const liked = track?.id ? p.isLiked(track.id) : false;
  const canControl = !!track || p.queue.length > 0;
  const isPhoneMode = viewportWidth <= PHONE_BREAKPOINT;

  if (isPhoneMode) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div className={`playerbar glass playerbar--mini${track ? " has-track" : " is-empty"}`}>
        <button
          type="button"
          className="playerbarMini__main"
          onClick={() => track && setRightPanelOpen(true)}
          disabled={!track}
        >
          <CoverArt
            src={track?.coverUrl}
            title={track?.title || t("track.titleFallback")}
            className={`playerbarMini__cover ${track ? "is-clickable" : ""}`}
          />

          <span className="playerbarMini__meta">
            <strong>{track?.title || t("player.emptyTitle")}</strong>
            <small>{track?.artist?.name || t("player.emptySubtitle")}</small>
          </span>
        </button>

        <div className="playerbarMini__actions">
          <button
            className="icon-btn playerbarMini__action"
            onClick={(event) => {
              event.stopPropagation();
              p.togglePlayPause();
            }}
            disabled={!canControl}
            title={p.isPlaying ? t("player.pause") : t("track.play")}
            aria-label={p.isPlaying ? t("player.pause") : t("track.play")}
            type="button"
          >
            {p.isPlaying ? <PauseIcon size={18} /> : <PlayIcon size={18} />}
          </button>
        </div>

        <div className="playerbarMini__progress" aria-hidden="true">
          <span style={{ width: `${progressPercent}%` }} />
        </div>
      </div>
    );
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="playerbar glass playerbar--root">
      <div className="playerbar__left">
        <CoverArt
          src={track?.coverUrl}
          title={track?.title || t("track.titleFallback")}
          className={`playerbar__cover ${track ? "is-clickable" : ""}`}
          onClick={() => track?.id && nav(`/app/track/${track.id}`)}
        />

        <div className="playerbar__meta">
          <div className="playerbar__track">{track?.title || t("player.emptyTitle")}</div>
          <div className="playerbar__artist">{track?.artist?.name || t("player.emptySubtitle")}</div>
        </div>
      </div>

      <div className="playerbar__center">
        <div className="playerbar__controls">
          <button
            className={`icon-btn playerbar__control ${p.isShuffled ? "is-active" : ""}`}
            onClick={p.toggleShuffle}
            disabled={!canControl}
            title={t("player.shuffle")}
            aria-label={t("player.shuffle")}
            aria-pressed={!!p.isShuffled}
            type="button"
          >
            <ShuffleIcon />
          </button>

          <button
            className="icon-btn playerbar__control"
            onClick={p.prev}
            disabled={!track}
            title={t("player.previous")}
            aria-label={t("player.previous")}
            type="button"
          >
            <PreviousIcon />
          </button>

          <button
            className="playerbar__playBtn"
            onClick={p.togglePlayPause}
            disabled={!canControl}
            title={p.isPlaying ? t("player.pause") : t("track.play")}
            aria-label={p.isPlaying ? t("player.pause") : t("track.play")}
            type="button"
          >
            {p.isPlaying ? <PauseIcon size={22} /> : <PlayIcon size={22} />}
          </button>

          <button
            className="icon-btn playerbar__control"
            onClick={p.next}
            disabled={!track}
            title={t("player.next")}
            aria-label={t("player.next")}
            type="button"
          >
            <NextIcon />
          </button>

          <button
            className={`icon-btn playerbar__control ${p.repeatOne ? "is-active" : ""}`}
            onClick={p.toggleRepeatOne}
            disabled={!canControl}
            title={t("player.repeatOne")}
            aria-label={t("player.repeatOne")}
            aria-pressed={!!p.repeatOne}
            type="button"
          >
            <RepeatOneIcon />
          </button>
        </div>

        <div className="playerbar__progress">
          <div className="playerbar__time">{formatSeconds(p.position)}</div>

          <div className="playerbar__sliderWrap">
            <input
              className="playerbar__range playerbar__range--progress"
              style={{ "--player-range-progress": `${progressPercent}%` }}
              type="range"
              min={0}
              max={Math.max(0, Number(p.duration || 0))}
              step={0.1}
              value={Math.min(Number(p.position || 0), Number(p.duration || 0) || 0)}
              onChange={(event) => p.seek(Number(event.target.value))}
              disabled={!track}
              aria-label={t("player.position")}
            />
          </div>

          <div className="playerbar__time">{formatSeconds(p.duration)}</div>
        </div>
      </div>

      <div className="playerbar__right" ref={rootRef}>
        <button
          className={`icon-btn playerbar__action playerbar__action--like ${liked ? "is-active" : ""}`}
          onClick={onToggleLike}
          disabled={!track || likePending}
          title={liked ? t("track.removeLike") : t("track.addLikePlain")}
          aria-label={liked ? t("track.removeLike") : t("track.addLikePlain")}
          type="button"
        >
          <HeartIcon filled={liked} />
        </button>

        <button
          className="icon-btn playerbar__action playerbar__action--queue"
          onClick={toggleRightPanel}
          disabled={!track}
          title={t("player.nowPlaying")}
          aria-label={t("player.nowPlaying")}
          type="button"
        >
          <QueueIcon />
        </button>

        <div className="playerbar__volume">
          <div className="playerbar__volumeIcon" aria-hidden="true">
            <VolumeHighIcon />
          </div>

          <div className="playerbar__sliderWrap playerbar__sliderWrap--volume">
            <input
              className="playerbar__range playerbar__range--volume"
              style={{ "--player-range-progress": `${volumePercent}%` }}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={Number(p.volume || 0)}
              onChange={(event) => p.setVolume(Number(event.target.value))}
              title={t("player.volume")}
              aria-label={t("player.volume")}
            />
          </div>
        </div>

        <button
          className="icon-btn playerbar__action playerbar__action--menu"
          onClick={() => {
            if (!track) return;
            if (!isAuth) {
              nav("/login");
              return;
            }
            setMenuOpen((value) => !value);
          }}
          disabled={!track}
          title={isAuth ? t("common.menu") : t("auth.login")}
          aria-label={isAuth ? t("common.menu") : t("auth.login")}
          type="button"
        >
          <DotsIcon />
        </button>

        {menuOpen && track ? (
          <div className="glass playerbar__menu">
            <div className="playerbar__menuTitle">{t("track.addToPlaylist")}</div>
            <UiSelect
              value={playlistId}
              onChange={(value) => setPlaylistId(String(value))}
              options={[
                { value: "", label: t("track.selectPlaylistShort") },
                ...playlists.map((item) => ({ value: String(item.id), label: item.name })),
              ]}
              placeholder={t("track.selectPlaylistShort")}
              width={260}
              align="left"
              portal={false}
            />

            <div className="playerbar__menuActions">
              <button
                onClick={addToPlaylist}
                disabled={!playlistId || checking || alreadyIn || addingToPlaylist}
                className="playerbar__playlistAction playerbar__playlistAction--primary"
                type="button"
              >
                {addingToPlaylist
                  ? t("common.adding")
                  : checking
                    ? t("track.checking")
                    : alreadyIn
                      ? t("track.alreadyAdded")
                      : t("track.add")}
              </button>
              <button onClick={() => setMenuOpen(false)} className="playerbar__playlistAction" type="button">
                {t("common.close")}
              </button>
            </div>

            {message ? <div className="playerbar__menuMsg">{message}</div> : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}

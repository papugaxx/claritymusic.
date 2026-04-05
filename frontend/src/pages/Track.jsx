

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getTrack } from "../services/api.js";
import { addTrackToPlaylistSafely, fetchSelectablePlaylistsResult, resolvePlaylistTrackMembership } from "../services/playlistMutations.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { usePlayerActions, usePlayerLikesState } from "../context/PlayerContext.jsx";
import UiSelect from "../components/ui/UiSelect.jsx";
import CoverArt from "../components/media/CoverArt.jsx";
import { useAppState } from "../context/AppStateContext.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { formatSeconds } from "../utils/audio.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Track() {
  const { id } = useParams();
  const nav = useNavigate();
  const playerActions = usePlayerActions();
  const playerLikes = usePlayerLikesState();
  const p = { ...playerActions, ...playerLikes };
  const { me, loading } = useAuth();
  const isAuth = !!me?.isAuthenticated;
  const { notifyPlaylistsChanged } = useAppState();
  const { t } = useI18n();

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [track, setTrack] = useState(null);
  const [trackLoading, setTrackLoading] = useState(true);
  const [trackError, setTrackError] = useState("");
  const [playlists, setPlaylists] = useState([]);
  const [playlistsLoading, setPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState("");
  const [playlistId, setPlaylistId] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);
  const [adding, setAdding] = useState(false);
  const [liking, setLiking] = useState(false);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    let alive = true;

    async function checkCurrentPlaylist() {
      setAlreadyIn(false);
      setMessage("");

      if (!playlistId || !track?.id || !isAuth) return;

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
  }, [playlistId, track?.id, isAuth]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadTrack = useCallback(async () => {
    setTrackLoading(true);
    setTrackError("");
    const res = await getTrack(id);
    if (res.ok) {
      setTrack(res.data);
      setTrackError("");
    } else {
      setTrack(null);
      setTrackError(res.status === 404 ? t("track.notFound") : res.error || t("track.loadFailed"));
    }
    setTrackLoading(false);
  }, [id, t]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadPlaylists = useCallback(async () => {
    setPlaylistsLoading(true);
    setPlaylistsError("");
    try {
      const res = await fetchSelectablePlaylistsResult();
      if (!res.ok) {
        setPlaylists([]);
        setPlaylistsError(res.error || t("track.playlistsLoadFailed"));
        return;
      }
      setPlaylists(Array.isArray(res.data) ? res.data : []);
      setPlaylistsError("");
    } catch {
      setPlaylists([]);
      setPlaylistsError(t("track.playlistsLoadFailed"));
    } finally {
      setPlaylistsLoading(false);
    }
  }, [t]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    loadTrack();
  }, [loadTrack]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (!loading && isAuth) loadPlaylists();
  }, [loading, isAuth, loadPlaylists]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function playTrack() {
    if (!track) return;
    p.playTrack(track, [track]);
  }

  async function addToPlaylist() {
    if (!playlistId || !track?.id || adding) return;

    setMessage("");
    if (alreadyIn) {
      setMessage(t("track.alreadyInPlaylist"));
      return;
    }

    setAdding(true);
    try {
      const res = await addTrackToPlaylistSafely(playlistId, track.id);
      if (!res.ok) {
        setMessage(res.error || t("track.addFailed"));
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
      setAdding(false);
    }
  }

  async function handleLike() {
    if (!track?.id || liking) return;
    if (!isAuth) {
      nav("/login");
      return;
    }
    setLiking(true);
    try {
      await p.toggleLike(track.id);
    } finally {
      setLiking(false);
    }
  }

  if (trackLoading) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div className="track-page">
        <div className="panel">{t("common.loading")}</div>
      </div>
    );
  }

  if (!track) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div className="track-page">
        <div className="panel">{trackError || t("track.notFound")}</div>
      </div>
    );
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="track-page">
      <div className="panel">
        <div className="track-hero">
          <CoverArt src={track?.coverUrl} title={track?.title || t("track.titleFallback")} className="track-hero__cover" />

          <div className="track-hero__meta">
            <h2 className="page-title track-hero__title">{track.title}</h2>
            <div className="page-sub track-hero__sub--flush">{track.artist?.name || "—"}</div>

            <div className="page-sub track-hero__sub--meta">
              {track.genre?.name ? `${t("player.genre")}: ${track.genre.name}` : ""}
              {track.mood?.name || track.moodName ? ` • ${t("player.mood")}: ${track.mood?.name || track.moodName}` : ""}
              {` • ${t("home.durationLabel")}: ${formatSeconds(track.durationSec)}`}
              {track.playsCount != null ? ` • ${t("track.plays")}: ${track.playsCount}` : ""}
            </div>

            <div className="row wrap track-hero__actions">
              <button className="btn primary track-hero__playBtn" onClick={playTrack} type="button">
                {t("track.play")}
              </button>

              <button className="btn track-hero__likeBtn" onClick={handleLike} disabled={liking} type="button">
                {p.isLiked(track.id)
                  ? t("track.removeLike")
                  : t("track.addLike")}
              </button>
            </div>
          </div>
        </div>

        {isAuth ? (
          <div className="track-playlist">
            <div className="page-sub track-playlist__label">{t("track.addToPlaylist")}</div>
            <div className="row wrap track-playlist__actions">
              <UiSelect
                value={playlistId}
                onChange={(value) => setPlaylistId(String(value))}
                options={[
                  { value: "", label: t("track.selectPlaylist") },
                  ...playlists.map((pl) => ({ value: String(pl.id), label: pl.name })),
                ]}
                placeholder={t("track.selectPlaylist")}
                width={260}
                align="left"
                disabled={playlistsLoading || !!playlistsError || playlists.length === 0}
              />
              <button className="btn" onClick={addToPlaylist} disabled={!playlistId || checking || alreadyIn || adding || playlistsLoading || !!playlistsError || playlists.length === 0} type="button">
                {adding
                  ? t("common.adding")
                  : checking
                    ? t("track.checking")
                    : alreadyIn
                      ? t("track.alreadyAdded")
                      : t("track.add")}
              </button>
              {playlistsLoading ? <div className="page-sub track-playlist__message">{t("common.loading")}</div> : null}
              {!playlistsLoading && playlistsError ? (
                <div className="page-sub track-playlist__message">
                  {playlistsError} <button className="btn" type="button" onClick={() => void loadPlaylists()}>{t("common.retry")}</button>
                </div>
              ) : null}
              {!playlistsLoading && !playlistsError && playlists.length === 0 ? <div className="page-sub track-playlist__message">{t("playlists.noPlaylists")}</div> : null}
              {message ? <div className="page-sub track-playlist__message">{message}</div> : null}
            </div>
          </div>
        ) : (
          <div className="track-login-hint">{t("track.loginHint")}</div>
        )}
      </div>
    </div>
  );
}

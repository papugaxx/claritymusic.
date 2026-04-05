

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  usePlayerActions,
  usePlayerLikesState,
  usePlayerQueueState,
  usePlayerTransportState,
} from "../../context/PlayerContext.jsx";
import { useAuth } from "../../hooks/useAuth.jsx";
import { getArtist, getTrack } from "../../services/api.js";
import { toAbs } from "../../services/media.js";
import {
  addTrackToPlaylistSafely,
  fetchSelectablePlaylists,
  resolvePlaylistTrackMembership,
} from "../../services/playlistMutations.js";
import CoverArt from "../media/CoverArt.jsx";
import ArtistAvatar from "../media/ArtistAvatar.jsx";
import { useAppState } from "../../context/AppStateContext.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";
import {
  getNextQueueTrack,
  mergeArtistData,
  mergeTrackData,
  pickArtistAvatar,
  pickArtistId,
  pickArtistName,
  pickTrackCover,
  toText,
} from "../../features/player/rightPanelView.js";
import UiSelect from "../ui/UiSelect.jsx";
import { formatSeconds } from "../../utils/audio.js";
import {
  AddIcon,
  HeartIcon,
  NextIcon,
  PauseIcon,
  PlayIcon,
  PreviousIcon,
  RepeatOneIcon,
  ShuffleIcon,
  VolumeHighIcon,
  VolumeMuteIcon,
} from "../player/PlayerIcons.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function percent(value, max) {
  if (!Number.isFinite(value) || !Number.isFinite(max) || max <= 0) return 0;
  return Math.min(100, Math.max(0, (value / max) * 100));
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function RightPanel({ mobileFullscreen = false }) {
  const nav = useNavigate();
  const queueState = usePlayerQueueState();
  const transportState = usePlayerTransportState();
  const actions = usePlayerActions();
  const likes = usePlayerLikesState();
  const { currentTrack, queue, currentIndex, isShuffled, repeatOne } = queueState;
  const { isPlaying, duration, position, volume } = transportState;
  const { playTrack, togglePlayPause, next, prev, toggleShuffle, toggleRepeatOne, seek, setVolume } = actions;
  const { me, loading } = useAuth();
  const isAuth = !!me?.isAuthenticated;
  const { setRightPanelOpen, notifyPlaylistsChanged } = useAppState();
  const { t } = useI18n();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [remoteTrack, setRemoteTrack] = useState(null);
  const [remoteArtist, setRemoteArtist] = useState(null);
  const [playlists, setPlaylists] = useState([]);
  const [playlistId, setPlaylistId] = useState("");
  const [message, setMessage] = useState("");
  const [checking, setChecking] = useState(false);
  const [alreadyIn, setAlreadyIn] = useState(false);
  const [addingToPlaylist, setAddingToPlaylist] = useState(false);
  const [likePending, setLikePending] = useState(false);
  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const lastVolumeRef = useRef(Math.max(0.35, Number(volume || 0) || 0.65));

  const currentTrackId = currentTrack?.id ?? null;
  const currentArtistId = pickArtistId(currentTrack);
  const shouldLoadTrack = !!currentTrackId && (!currentTrack?.genre?.name || !currentTrack?.mood?.name || !currentTrack?.artist?.name);
  const shouldLoadArtist = !!currentArtistId && (!currentTrack?.artist?.avatarUrl || !currentTrack?.artist?.coverUrl);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const nextTrack = useMemo(
    () => getNextQueueTrack(queue, currentIndex, currentTrack?.id ?? null),
    [queue, currentIndex, currentTrack?.id],
  );

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    if (!currentTrackId || (!shouldLoadTrack && !shouldLoadArtist)) {
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const [trackRes, artistRes] = await Promise.all([
          shouldLoadTrack ? getTrack(currentTrackId) : Promise.resolve(null),
          shouldLoadArtist ? getArtist(currentArtistId) : Promise.resolve(null),
        ]);

        if (cancelled) return;

        setRemoteTrack(trackRes?.ok && trackRes.data && typeof trackRes.data === "object" ? trackRes.data : null);
        setRemoteArtist(artistRes?.ok && artistRes.data && typeof artistRes.data === "object" ? artistRes.data : null);
      } catch {
        if (cancelled) return;
        setRemoteTrack(null);
        setRemoteArtist(null);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [currentTrackId, currentArtistId, shouldLoadTrack, shouldLoadArtist]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    if (!loading && isAuth && addSheetOpen) {
      fetchSelectablePlaylists().then(setPlaylists).catch(() => setPlaylists([]));
    }
  }, [addSheetOpen, isAuth, loading]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    let alive = true;

    async function checkCurrentPlaylist() {
      setAlreadyIn(false);
      setMessage("");
      if (!addSheetOpen || !playlistId || !currentTrack?.id || !isAuth) return;
      setChecking(true);
      try {
        const res = await resolvePlaylistTrackMembership(playlistId, currentTrack.id);
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
  }, [addSheetOpen, playlistId, currentTrack?.id, isAuth]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (Number(volume || 0) > 0.02) {
      lastVolumeRef.current = Number(volume || 0);
    }
  }, [volume]);

  if (!currentTrack) return null;

  const resolvedTrack = remoteTrack?.id === currentTrack.id ? remoteTrack : null;
  const resolvedArtist = remoteArtist?.id === pickArtistId(currentTrack) ? remoteArtist : null;
  const trackView = mergeTrackData(currentTrack, resolvedTrack);
  const artistView = mergeArtistData(trackView?.artist, resolvedArtist);
  const cover = toAbs(pickTrackCover(trackView));
  const artistName = artistView?.name || pickArtistName(trackView);
  const artistId = artistView?.id || pickArtistId(trackView);
  const artistImage = toAbs(pickArtistAvatar(artistView));
  const liked = currentTrack?.id ? likes.isLiked(currentTrack.id) : false;
  const canControl = !!currentTrack || queue.length > 0;
  const progressPercent = percent(Number(position || 0), Number(duration || 0));
  const volumePercent = Math.min(100, Math.max(0, Number(volume || 0) * 100));

  
  // Нижче оголошено обробник який реагує на дію користувача і змінює стан
  const openArtist = () => {
    if (!artistId) return;
    nav(`/app/artists/${artistId}`);
  };

  const genreValue =
    trackView?.genreName ||
    trackView?.genre?.name ||
    trackView?.genre?.title ||
    trackView?.genre?.label ||
    trackView?.genre;
  const moodValue =
    trackView?.moodName ||
    trackView?.mood?.name ||
    trackView?.mood?.title ||
    trackView?.mood?.label ||
    trackView?.moodTitle ||
    trackView?.moodLabel ||
    trackView?.mood;

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function toggleMute() {
    const currentVolume = Number(volume || 0);
    if (currentVolume <= 0.02) {
      setVolume(Math.max(0.35, Number(lastVolumeRef.current || 0.65)));
      return;
    }
    lastVolumeRef.current = currentVolume;
    setVolume(0);
  }

  const credits = [
    { label: t("player.mainArtist"), value: artistName },
    { label: t("player.genre"), value: toText(genreValue) || "—" },
    { label: t("player.mood"), value: toText(moodValue) || "—" },
  ];

  
  // Нижче оголошено обробник який реагує на дію користувача і змінює стан
  const openTrack = (track) => {
    if (!track?.id) return;
    if (typeof playTrack === "function") {
      playTrack(track, queue);
      return;
    }
    nav(`/app/track/${track.id}`);
  };

  async function onToggleLike() {
    if (!currentTrack?.id || likePending) return;
    if (!isAuth) {
      nav("/login");
      return;
    }
    setLikePending(true);
    try {
      await likes.toggleLike(currentTrack.id);
    } finally {
      setLikePending(false);
    }
  }

  async function addToPlaylist() {
    if (!currentTrack?.id || !playlistId || addingToPlaylist) return;
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
      const res = await addTrackToPlaylistSafely(playlistId, currentTrack.id);
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

  if (mobileFullscreen) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <section className="mobileNowPlaying" aria-label={t("player.nowPlaying")}>
        <div className="mobileNowPlaying__header">
          <div className="mobileNowPlaying__eyebrow">{t("player.nowPlaying")}</div>
          <button className="icon-btn mobileNowPlaying__close" onClick={() => setRightPanelOpen(false)} title={t("common.close")} aria-label={t("common.close")} type="button">✕</button>
        </div>

        <div className="mobileNowPlaying__body">
          <div className="mobileNowPlaying__artWrap">
            <CoverArt src={cover} title={trackView?.title || currentTrack?.title || t("track.titleFallback")} className="mobileNowPlaying__cover" />
          </div>

          <div className="mobileNowPlaying__meta">
            <div className="mobileNowPlaying__title">{trackView?.title || currentTrack?.title}</div>
            <button className={`mobileNowPlaying__artist${artistId ? " is-clickable" : ""}`} onClick={artistId ? openArtist : undefined} disabled={!artistId} title={artistId ? t("player.viewArtist") : artistName} type="button">
              {artistName}
            </button>
          </div>

          <div className="mobileNowPlaying__progressBlock">
            <input className="mobileNowPlaying__range" style={{ "--player-range-progress": `${progressPercent}%` }} type="range" min={0} max={Math.max(0, Number(duration || 0))} step={0.1} value={Math.min(Number(position || 0), Number(duration || 0) || 0)} onChange={(event) => seek(Number(event.target.value))} disabled={!currentTrack} aria-label={t("player.position")} />
            <div className="mobileNowPlaying__times"><span>{formatSeconds(position)}</span><span>{formatSeconds(duration)}</span></div>
          </div>

          <div className="mobileNowPlaying__volumeRow">
            <button
              className={`mobileNowPlaying__volumeToggle${Number(volume || 0) <= 0.02 ? " is-muted" : ""}`}
              onClick={toggleMute}
              title={Number(volume || 0) <= 0.02 ? t("player.unmute") : t("player.mute")}
              aria-label={Number(volume || 0) <= 0.02 ? t("player.unmute") : t("player.mute")}
              aria-pressed={Number(volume || 0) <= 0.02}
              type="button"
            >
              {Number(volume || 0) <= 0.02 ? <VolumeMuteIcon size={18} /> : <VolumeHighIcon size={18} />}
            </button>
            <input
              className="mobileNowPlaying__volumeRange"
              style={{ "--player-range-progress": `${volumePercent}%` }}
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={Number(volume || 0)}
              onChange={(event) => setVolume(Number(event.target.value))}
              aria-label={t("player.volume")}
            />
          </div>

          <div className="mobileNowPlaying__controlRow mobileNowPlaying__controlRow--secondary">
            <button className={`icon-btn mobileNowPlaying__control ${isShuffled ? "is-active" : ""}`} onClick={toggleShuffle} disabled={!canControl} title={t("player.shuffle")} aria-label={t("player.shuffle")} aria-pressed={!!isShuffled} type="button"><ShuffleIcon size={18} /></button>
            <button className="icon-btn mobileNowPlaying__control" onClick={prev} disabled={!currentTrack} title={t("player.previous")} aria-label={t("player.previous")} type="button"><PreviousIcon size={20} /></button>
            <button className="mobileNowPlaying__playBtn" onClick={togglePlayPause} disabled={!canControl} title={isPlaying ? t("player.pause") : t("track.play")} aria-label={isPlaying ? t("player.pause") : t("track.play")} type="button">{isPlaying ? <PauseIcon size={28} /> : <PlayIcon size={28} />}</button>
            <button className="icon-btn mobileNowPlaying__control" onClick={next} disabled={!currentTrack} title={t("player.next")} aria-label={t("player.next")} type="button"><NextIcon size={20} /></button>
            <button className={`icon-btn mobileNowPlaying__control ${repeatOne ? "is-active" : ""}`} onClick={toggleRepeatOne} disabled={!canControl} title={t("player.repeatOne")} aria-label={t("player.repeatOne")} aria-pressed={!!repeatOne} type="button"><RepeatOneIcon size={18} /></button>
          </div>

          <div className="mobileNowPlaying__actionsRow">
            <button className={`mobileNowPlaying__pillAction ${liked ? "is-active" : ""}`} onClick={onToggleLike} disabled={!currentTrack || likePending} type="button"><HeartIcon filled={liked} size={18} /><span>{liked ? t("track.liked") : t("track.addLikePlain")}</span></button>
            <button className={`mobileNowPlaying__pillAction ${addSheetOpen ? "is-active" : ""}`} onClick={() => { if (!isAuth) { nav("/login"); return; } setAddSheetOpen((value) => !value); }} type="button"><AddIcon size={18} /><span>{t("track.addToPlaylist")}</span></button>
          </div>

          <button className={`mobileNowPlaying__artistCard${artistId ? " is-clickable" : ""}`} onClick={artistId ? openArtist : undefined} disabled={!artistId} type="button">
            <div className="mobileNowPlaying__artistMedia"><ArtistAvatar src={artistImage} name={artistName} className="mobileNowPlaying__artistAvatar" /></div>
            <div className="mobileNowPlaying__artistBody"><span className="mobileNowPlaying__artistKicker">{t("player.aboutArtist")}</span><strong>{artistName}</strong><small>{artistId ? t("player.viewArtist") : t("player.artistInfo")}</small></div>
          </button>
        </div>

        {addSheetOpen ? (
          <>
            <button className="mobileNowPlaying__sheetBackdrop" type="button" aria-label={t("common.close")} onClick={() => setAddSheetOpen(false)} />
            <div className="mobileNowPlaying__sheetDialog glass">
              <div className="mobileNowPlaying__sheetTitle">{t("track.addToPlaylist")}</div>
              <UiSelect value={playlistId} onChange={(value) => setPlaylistId(String(value))} options={[{ value: "", label: t("track.selectPlaylistShort") }, ...playlists.map((item) => ({ value: String(item.id), label: item.name }))]} placeholder={t("track.selectPlaylistShort")} width="100%" align="left" portal={false} />
              <div className="mobileNowPlaying__sheetActions">
                <button onClick={addToPlaylist} disabled={!playlistId || checking || alreadyIn || addingToPlaylist} className="mobileNowPlaying__sheetBtn mobileNowPlaying__sheetBtn--primary" type="button">{addingToPlaylist ? t("common.adding") : checking ? t("track.checking") : alreadyIn ? t("track.alreadyAdded") : t("track.add")}</button>
                <button onClick={() => setAddSheetOpen(false)} className="mobileNowPlaying__sheetBtn" type="button">{t("common.close")}</button>
              </div>
              {message ? <div className="mobileNowPlaying__sheetMsg">{message}</div> : null}
            </div>
          </>
        ) : null}
      </section>
    );
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <aside className="rightcard rp" aria-label={t("player.nowPlaying")}>
      <div className="rp__header">
        <div className="rp__headerTitle">{t("player.nowPlaying")}</div>
        <button className="icon-btn rp__close" onClick={() => setRightPanelOpen(false)} title={t("player.hidePanel")} aria-label={t("player.hidePanel")} type="button">✕</button>
      </div>

      <button className="rp__cover" type="button" onClick={() => nav(`/app/track/${trackView?.id || currentTrack.id}`)} title={t("track.open")}>
        <CoverArt src={cover} title={trackView?.title || currentTrack?.title || t("track.titleFallback")} className="rp__coverMedia" />
      </button>

      <div className="rp__meta">
        <button className="rp__track" onClick={() => nav(`/app/track/${trackView?.id || currentTrack.id}`)} title={t("track.open")} type="button">{trackView?.title || currentTrack?.title}</button>
        <button className={`rp__sub${artistId ? " is-clickable" : ""}`} onClick={artistId ? openArtist : undefined} title={artistId ? t("player.viewArtist") : artistName} type="button" disabled={!artistId}>{artistName}</button>
      </div>

      <section className="rp__section">
        <div className="rp__sectionTitle">{t("player.aboutArtist")}</div>
        <button className={`rp__artistCard${artistId ? " is-clickable" : ""}`} onClick={artistId ? openArtist : undefined} title={artistId ? t("player.viewArtist") : artistName} type="button" disabled={!artistId}>
          <div className="rp__artistMedia"><ArtistAvatar src={artistImage} name={artistName} className="rp__artistAvatar" /></div>
          <div className="rp__artistBody"><div className="rp__artistName">{artistName}</div><div className="rp__artistHint">{artistId ? t("player.viewArtist") : t("player.artistInfo")}</div></div>
        </button>
      </section>

      <section className="rp__section">
        <div className="rp__sectionTitle">{t("player.credits")}</div>
        <div className="rp__credits">{credits.map((item) => (<div className="rp__creditRow" key={item.label}><div className="rp__creditLabel">{item.label}</div><div className="rp__creditValue" title={item.value}>{item.value}</div></div>))}</div>
      </section>

      <section className="rp__section">
        <div className="rp__sectionTitle">{t("player.nextInQueue")}</div>
        {nextTrack ? (<button className="rp__next" onClick={() => openTrack(nextTrack)} title={nextTrack?.title || t("track.open")} type="button"><div className="rp__nextCover"><CoverArt src={nextTrack?.coverUrl} title={nextTrack?.title || t("track.titleFallback")} className="rp__nextCoverMedia" /></div><div className="rp__nextMeta"><div className="rp__nextTitle">{nextTrack?.title || t("track.untitled")}</div><div className="rp__nextSub">{pickArtistName(nextTrack)}</div></div></button>) : (<div className="rp__muted">{t("player.noNextTrack")}</div>)}
      </section>
    </aside>
  );
}

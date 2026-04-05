

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import {
  getLookups,
  getMyFollowing,
  upsertMyArtistProfile,
  getMyArtistProfile,
  getMyArtistTracks,
  createMyArtistTrack,
  updateMyArtistTrack,
  patchMyArtistTrackStatus,
  deleteMyArtistTrack
} from "../services/api.js";
import { toAbs } from "../services/media.js";
import { AUDIO_ACCEPT, IMAGE_ACCEPT } from "../services/uploadValidation.js";
import Modal from "../components/ui/Modal.jsx";
import PortalSelect from "../components/ui/PortalSelect.jsx";
import EditProfileModal from "../components/profile/EditProfileModal.jsx";
import TrackTileCard from "../components/track/TrackTileCard.jsx";
import ProfileHeroCard from "../components/profile/ProfileHeroCard.jsx";
import ArtistAvatar from "../components/media/ArtistAvatar.jsx";
import CoverArt from "../components/media/CoverArt.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { reportDevError } from "../utils/runtime.js";
import { isArtist } from "../utils/auth.js";
import { fmtSec, formatPlays, getMp3DurationSec, isImageFile, isMp3File, trackGenreName, uploadImageTryEndpoints, uploadMp3TryEndpoints } from "../features/artistStudio/studioHelpers.js";


// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function ArtistStudio() {
  const { t } = useI18n();
  const nav = useNavigate();
  const { me, loading, refreshMe } = useAuth();
  
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const isArtistAccount = useMemo(() => isArtist(me), [me]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    imageRequired: t("artistStudio.imageRequired"),
    coverUploadEndpointFailed: t("artistStudio.coverUploadEndpointFailed"),
    coverUploaded: t("artistStudio.coverUploaded"),
    mp3Required: t("artistStudio.mp3Required"),
    mp3UploadFailed: t("artistStudio.mp3UploadFailed"),
    mp3Uploaded: t("artistStudio.mp3Uploaded"),
    enterTrackTitle: t("artistStudio.enterTrackTitle"),
    chooseGenre: t("artistStudio.chooseGenre"),
    uploadMp3First: t("artistStudio.uploadMp3First"),
    invalidDuration: t("artistStudio.invalidDuration"),
    hideTrackFailed: t("artistStudio.hideTrackFailed"),
    trackDisabled: t("artistStudio.trackDisabled"),
    publishTrackFailed: t("artistStudio.publishTrackFailed"),
    trackEnabled: t("artistStudio.trackEnabled"),
    deleteTrackFailed: t("artistStudio.deleteTrackFailed"),
    trackDeleted: t("artistStudio.trackDeleted"),
    createTrackFailed: t("artistStudio.createTrackFailed"),
    trackCreated: t("artistStudio.trackCreated"),
    updateTrackFailed: t("artistStudio.updateTrackFailed"),
    changesSaved: t("artistStudio.changesSaved"),
    saveTrackFailed: t("artistStudio.saveTrackFailed"),
    artistFallback: t("artistStudio.artistFallback"),
    chooseGenrePlaceholder: t("artistStudio.chooseGenrePlaceholder"),
    chooseMoodPlaceholder: t("artistStudio.chooseMoodPlaceholder"),
    loading: t("common.loading"),
    accessDeniedTitle: t("artistStudio.accessDeniedTitle"),
    accessDeniedText: t("artistStudio.accessDeniedText"),
    back: t("common.back"),
    badge: t("artistStudio.badge"),
    heroSubtitle: (tracks, plays) => t("artistStudio.heroSubtitle", { tracks, plays }),
    profileSaved: t("artistStudio.profileSaved"),
    avatarUploadFailed: t("artistStudio.avatarUploadFailed"),
    saveProfileFailed: t("artistStudio.saveProfileFailed"),
    editTrackTitle: t("artistStudio.editTrackTitle"),
    uploadTrackTitle: t("artistStudio.uploadTrackTitle"),
    resetAndClose: t("artistStudio.resetAndClose"),
    close: t("common.close"),
    save: t("common.save"),
    publish: t("artistStudio.publish"),
    trackTitle: t("artistStudio.trackTitle"),
    trackTitlePlaceholder: t("artistStudio.trackTitlePlaceholder"),
    artistName: t("artistStudio.artistName"),
    genre: t("artistStudio.genre"),
    mood: t("artistStudio.mood"),
    trackCover: t("artistStudio.trackCover"),
    addCover: t("artistStudio.addCover"),
    coverAdded: t("artistStudio.coverAdded"),
    track: t("artistStudio.track"),
    addTrack: t("artistStudio.addTrack"),
    trackAdded: t("artistStudio.trackAdded"),
    publishNow: t("artistStudio.publishNow"),
    saveHidden: t("artistStudio.saveHidden"),
    deleteTrackTitle: t("artistStudio.deleteTrackTitle"),
    cancel: t("common.cancel"),
    delete: t("common.delete"),
  }), [t]);

  
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [toast, setToast] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [audioFileName, setAudioFileName] = useState("");
  const [coverUploading, setCoverUploading] = useState(false);
  const [coverFileName, setCoverFileName] = useState("");
  const [coverInputKey, setCoverInputKey] = useState(1);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState("");
  const [fileInputKey, setFileInputKey] = useState(1);
  const coverInputRef = useRef(null);
  const audioInputRef = useRef(null);

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [genres, setGenres] = useState([]);
  const [moods, setMoods] = useState([]);
  const [tracks, setTracks] = useState([]);
  const [tracksLoading, setTracksLoading] = useState(false);
  const [following, setFollowing] = useState([]);

  const [profileOpen, setProfileOpen] = useState(false);
  const [trackOpen, setTrackOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const [profile, setProfile] = useState({
    name: "",
    avatarUrl: "",
    coverUrl: "",
    slug: "",
  });

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const emptyForm = useMemo(
    () => ({
      id: null,
      title: "",
      genreId: 0,
      moodId: 0,
      durationSec: 180,
      audioUrl: "",
      coverUrl: "",
      isActive: true,
    }),
    []
  );

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [form, setForm] = useState(emptyForm);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2400);
    return () => clearTimeout(t);
  }, [toast]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (loading) return;
    if (!me?.isAuthenticated) {
      nav("/login", { replace: true });
    }
  }, [loading, me, nav]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadGenres = useCallback(async () => {
    if (!me?.isAuthenticated) return { genres: [], moods: [] };

    let nextGenres = [];
    let nextMoods = [];

    try {
      const lookups = await getLookups();
      if (lookups.ok) {
        nextGenres = Array.isArray(lookups.data?.genres) ? lookups.data.genres : [];
        nextMoods = Array.isArray(lookups.data?.moods) ? lookups.data.moods : [];
      }
    } catch (error) {
      reportDevError("artistStudio.loadGenres", error);
    }

    setGenres(nextGenres);
    setMoods(nextMoods);
    return { genres: nextGenres, moods: nextMoods };
  }, [me?.isAuthenticated]);

  
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadProfile = useCallback(async () => {
    if (!me?.isAuthenticated) return;
    setErr("");
    const p = await getMyArtistProfile();
    if (p.ok) {
      setProfile({
        name: p.data?.name || "",
        avatarUrl: p.data?.avatarUrl || "",
        coverUrl: p.data?.coverUrl || "",
        slug: p.data?.slug || "",
      });
    }
  }, [me?.isAuthenticated]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadFollowing = useCallback(async () => {
    if (!me?.isAuthenticated) return;
    const f = await getMyFollowing();
    if (f.ok) setFollowing(Array.isArray(f.data?.items) ? f.data.items : []);
    else setFollowing([]);
  }, [me?.isAuthenticated]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadTracks = useCallback(async () => {
    if (!isArtistAccount) return;
    setTracksLoading(true);
    const t = await getMyArtistTracks();
    if (t.ok) setTracks(Array.isArray(t.data?.items) ? t.data.items : []);
    else setTracks([]);
    setTracksLoading(false);
  }, [isArtistAccount]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    if (loading) return;
    if (!me?.isAuthenticated) return;

    (async () => {
      await Promise.all([loadGenres(), loadProfile(), loadFollowing()]);
    })();
  }, [loading, me, loadGenres, loadProfile, loadFollowing]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (loading) return;
    if (!me?.isAuthenticated) return;
    loadTracks();
  }, [loading, me, isArtistAccount, loadTracks]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => () => {
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
  }, [coverPreviewUrl]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function resetForm(nextGenres = genres, nextMoods = moods) {
    setAudioFileName("");
    setCoverFileName("");
    setUploading(false);
    setCoverUploading(false);
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setCoverPreviewUrl("");
    setForm({
      ...emptyForm,
      genreId: Number(nextGenres?.[0]?.id || 0),
      moodId: Number(nextMoods?.[0]?.id || 0),
    });
  }

  async function startCreateTrack() {
    setErr("");
    const data = await loadGenres();
    resetForm(data.genres, data.moods);
    setTrackOpen(true);
  }

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!trackOpen) return;

    setForm((prev) => {
      const next = { ...prev };
      const hasGenre = genres.some((item) => Number(item?.id) === Number(next.genreId));
      const hasMood = moods.some((item) => Number(item?.id) === Number(next.moodId));

      if (!hasGenre && genres.length > 0) next.genreId = Number(genres[0].id);
      if (!hasMood && moods.length > 0) next.moodId = Number(moods[0].id);

      return next;
    });
  }, [trackOpen, genres, moods]);

  
  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function startEdit(track) {
    setErr("");
    setAudioFileName("");
    setCoverFileName("");
    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setCoverPreviewUrl(String(track.coverUrl || "").trim());
    setForm({
      id: track.id,
      title: track.title || "",
      genreId: Number(track.genreId ?? track.genre?.id ?? 0),
      moodId: Number(track.moodId ?? track.mood?.id ?? 0),
      durationSec: Number(track.durationSec || 180),
      audioUrl: track.audioUrl || "",
      coverUrl: track.coverUrl || "",
      isActive: track.isActive !== false,
    });
    setTrackOpen(true);
  }

  async function onPickCover(file) {
    setErr("");
    if (!file) return;

    if (!isImageFile(file)) {
      setErr(text.imageRequired);
      return;
    }

    const previousPreviewUrl = String(coverPreviewUrl || "");
    const previousServerCoverUrl = String(form.coverUrl || "");

    if (coverPreviewUrl && coverPreviewUrl.startsWith("blob:")) {
      URL.revokeObjectURL(coverPreviewUrl);
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setCoverPreviewUrl(localPreviewUrl);
    setCoverUploading(true);
    setCoverFileName(file.name || "cover");

    const up = await uploadImageTryEndpoints(file, "cover");
    setCoverUploading(false);

    if (!up.ok || !up.url) {
      try {
        URL.revokeObjectURL(localPreviewUrl);
      } catch (error) {
        reportDevError("artistStudio.revokeLocalCoverPreview", error);
      }
      setCoverPreviewUrl(previousServerCoverUrl || previousPreviewUrl || "");
      setErr(up.error || text.coverUploadEndpointFailed);
      return;
    }

    if (localPreviewUrl.startsWith("blob:")) {
      try {
        URL.revokeObjectURL(localPreviewUrl);
      } catch (error) {
        reportDevError("artistStudio.revokeUploadedCoverPreview", error);
      }
    }

    setCoverPreviewUrl(up.url);
    setForm((f) => ({ ...f, coverUrl: up.url }));
    setToast(text.coverUploaded);
  }

  async function onPickMp3(file) {
    setErr("");
    if (!file) return;

    if (!isMp3File(file)) {
      setErr(text.mp3Required);
      return;
    }

    setUploading(true);
    setAudioFileName(file.name || "audio.mp3");

    try {
      const d = await getMp3DurationSec(file);
      if (d) setForm((f) => ({ ...f, durationSec: d }));
    } catch (error) {
      reportDevError("artistStudio.readPickedMp3Duration", error);
    }

    const up = await uploadMp3TryEndpoints(file);
    setUploading(false);

    if (!up.ok || !up.url) {
      setErr(text.mp3UploadFailed);
      return;
    }

    setForm((f) => ({ ...f, audioUrl: up.url }));
    setToast(text.mp3Uploaded);
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function validateTrackForm(f) {
    const title = String(f.title || "").trim();
    if (!title) return text.enterTrackTitle;
    if (!Number(f.genreId)) return text.chooseGenre;
    const url = String(f.audioUrl || "").trim();
    if (!url) return text.uploadMp3First;
    if (!Number(f.durationSec || 0)) return text.invalidDuration;
    return null;
  }

  async function softDeactivate(id) {
    if (!id) return;
    setBusy(true);
    setErr("");
    const res = await patchMyArtistTrackStatus(id, false);
    if (!res.ok) setErr(res.error || text.hideTrackFailed);
    else setToast(text.trackDisabled);
    await loadTracks();
    setBusy(false);
  }

  async function softActivate(id) {
    if (!id) return;
    setBusy(true);
    setErr("");
    const res = await patchMyArtistTrackStatus(id, true);
    if (!res.ok) setErr(res.error || text.publishTrackFailed);
    else setToast(text.trackEnabled);
    await loadTracks();
    setBusy(false);
  }

  async function confirmDeleteTrack() {
    if (!deleteTarget?.id) return;
    setBusy(true);
    setErr("");
    try {
      const res = await deleteMyArtistTrack(deleteTarget.id);
      if (!res.ok) {
        setErr(res.error || text.deleteTrackFailed);
        return;
      }
      setToast(text.trackDeleted);
      setDeleteTarget(null);
      await loadTracks();
    } finally {
      setBusy(false);
    }
  }

  async function saveTrack() {
    const v = validateTrackForm(form);
    if (v) {
      setErr(v);
      return;
    }

    setBusy(true);
    setErr("");

    try {
      const payload = {
        title: String(form.title || "").trim(),
        genreId: Number(form.genreId),
        moodId: Number(form.moodId) > 0 ? Number(form.moodId) : null,
        durationSec: Number(form.durationSec || 0),
        audioUrl: String(form.audioUrl || "").trim(),
        coverUrl: String(form.coverUrl || "").trim() || null,
        isActive: !!form.isActive,
      };

      if (!form.id) {
        const res = await createMyArtistTrack(payload);
        if (!res.ok) {
          setErr(res.error || text.createTrackFailed);
          return;
        }
        setToast(text.trackCreated);
      } else {
        const res = await updateMyArtistTrack(form.id, payload);
        if (!res.ok) {
          setErr(res.error || text.updateTrackFailed);
          return;
        }
        setToast(text.changesSaved);
      }

      await loadTracks();
      setTrackOpen(false);
      resetForm();
    } catch (e) {
      setErr(e?.message || text.saveTrackFailed);
    } finally {
      setBusy(false);
    }
  }

  const displayName = profile.name || text.artistFallback;
  const avatarUrl = toAbs(profile.avatarUrl || me?.avatarUrl || me?.avatar || "");
  const coverUrl = toAbs(profile.coverUrl || "");
  const publishedTracks = tracks.filter((t) => t.isActive !== false);
  const totalPlays = tracks.reduce((sum, track) => sum + Number(track?.playsCount || 0), 0);
  const followingCount = following.length;
  const topTracks = [...tracks]
    .sort((a, b) => Number(b?.playsCount || 0) - Number(a?.playsCount || 0))
    .slice(0, 5);
  const recentTracks = [...tracks].slice(0, 6);
  const genreSelectOptions = [
    { value: 0, label: text.chooseGenrePlaceholder },
    ...genres.map((g) => ({ value: g.id, label: g.name })),
  ];
  const moodSelectOptions = [
    { value: 0, label: text.chooseMoodPlaceholder },
    ...moods.map((m) => ({ value: m.id, label: m.name })),
  ];

  if (loading) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div className="sp-page sp-page--studio">
        <div className="sp-card sp-section">{text.loading}</div>
      </div>
    );
  }

  if (!isArtistAccount) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div className="sp-page sp-page--studio">
        <div className="sp-card sp-section">
          <div className="sp-accessDeniedTitle">{text.accessDeniedTitle}</div>
          <div className="sp-accessDeniedText">
            {text.accessDeniedText}
          </div>
          <div className="sp-accessDeniedActions">
            <Link className="sp-btn" to="/app/me">
              {text.back}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (!me?.isAuthenticated) return null;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="sp-page sp-page--studio">
      <ProfileHeroCard
        badge={text.badge}
        title={displayName}
        subtitle={text.heroSubtitle(publishedTracks.length, formatPlays(totalPlays))}
        avatarSrc={avatarUrl}
        avatarName={displayName}
        coverSrc={coverUrl}
        stats={[
          { label: t("common.tracks"), value: tracks.length },
          { label: t("studio.published"), value: publishedTracks.length },
          { label: t("profile.following"), value: followingCount },
          { label: t("studio.totalPlays"), value: formatPlays(totalPlays) },
        ]}
        actions={
          <>
            <button className="sp-btn sp-btn--primary" onClick={startCreateTrack}>
              {t("studio.uploadTrack")}
            </button>
            <button className="sp-btn" onClick={() => setProfileOpen(true)}>
              {t("studio.editProfile")}
            </button>
          </>
        }
      />

      {toast ? <div className="sp-loadingLine">✅ {toast}</div> : null}
      {err ? <div className="sp-bannerError">⚠ {err}</div> : null}

      <div className="sp-profileLayout">
        <div className="sp-profileMain">
          <section className="sp-card sp-section">
            <div className="sp-section__head">
              <div>
                <div className="sp-h">{t("studio.overview")}</div>
                <div className="sp-section__sub">{t("studio.overviewSub")}</div>
              </div>
            </div>

            <div className="sp-metricGrid">
              <article className="sp-metricCard">
                <div className="sp-metricCard__label">{t("studio.totalPlays")}</div>
                <div className="sp-metricCard__value">{formatPlays(totalPlays)}</div>
                <div className="sp-metricCard__sub">{t("studio.totalPlaysSub")}</div>
              </article>

              <article className="sp-metricCard">
                <div className="sp-metricCard__label">{t("studio.publishedTracks")}</div>
                <div className="sp-metricCard__value">{publishedTracks.length}</div>
                <div className="sp-metricCard__sub">{t("studio.publishedTracksSub")}</div>
              </article>

              <article className="sp-metricCard">
                <div className="sp-metricCard__label">{t("profile.following")}</div>
                <div className="sp-metricCard__value">{followingCount}</div>
                <div className="sp-metricCard__sub">{t("studio.followingSub")}</div>
              </article>
            </div>
          </section>

          <section className="sp-card sp-section">
            <div className="sp-section__head">
              <div>
                <div className="sp-h">{t("studio.yourTracks")}</div>
                <div className="sp-section__sub">{t("studio.yourTracksSub")}</div>
              </div>
              <div className="sp-head-actions">
                <button className="sp-btn sp-btn--ghost" onClick={loadTracks} disabled={tracksLoading || busy}>
                  {t("studio.refresh")}
                </button>
                <button className="sp-btn sp-btn--primary" onClick={startCreateTrack}>
                  + {t("studio.newTrack")}
                </button>
              </div>
            </div>

            {tracksLoading ? (
              <div className="sp-empty">{text.loading}</div>
            ) : tracks.length === 0 ? (
              <div className="sp-empty">{t("studio.noTracks")}</div>
            ) : (
              <div className="sp-trackListModern">
                {tracks.map((track, index) => (
                  <div key={track.id} className="sp-trackRowModern sp-trackRowModern--studio">
                    <div className="sp-trackRowModern__index">{index + 1}</div>

                    <CoverArt
                      src={toAbs(track.coverUrl || "")}
                      title={track.title}
                      className="sp-trackRowModern__cover"
                    />

                    <div className="sp-trackRowModern__main">
                      <Link className="sp-trackRowModern__titleLink" to={`/app/track/${track.id}`}>
                        {track.title}
                      </Link>
                      <div className="sp-trackRowModern__meta">
                        {trackGenreName(track, genres)} · {fmtSec(track.durationSec)} · {formatPlays(track.playsCount)} {t("studio.plays")}
                      </div>
                    </div>

                    <div className="sp-trackRowModern__side sp-trackRowModern__side--studio">
                      <span className={`sp-statusPill ${track.isActive ? "is-active" : "is-muted"}`}>
                        {track.isActive ? t("studio.published") : t("studio.hidden")}
                      </span>
                    </div>

                    <div className="sp-inlineActions">
                      <button className="sp-btn" onClick={() => startEdit(track)} disabled={busy}>
                        {t("studio.edit")}
                      </button>
                      <button
                        className="sp-btn"
                        onClick={() => (track.isActive ? softDeactivate(track.id) : softActivate(track.id))}
                        disabled={busy}
                      >
                        {track.isActive ? t("studio.hide") : t("studio.publish")}
                      </button>
                      <button className="sp-btn" onClick={() => setDeleteTarget(track)} disabled={busy}>
                        {t("studio.delete")}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          <section className="sp-card sp-section">
            <div className="sp-section__head">
              <div>
                <div className="sp-h">{t("studio.topPerforming")}</div>
                <div className="sp-section__sub">{t("studio.topPerformingSub")}</div>
              </div>
            </div>

            {topTracks.length === 0 ? (
              <div className="sp-empty">{t("studio.noTracks")}</div>
            ) : (
              <div className="sp-cards sp-cards--compact">
                {topTracks.map((track) => (
                  <TrackTileCard
                    key={track.id}
                    track={{ ...track, coverUrl: toAbs(track.coverUrl || "") }}
                    queue={topTracks}
                    subtitle={`${formatPlays(track.playsCount)} ${t("studio.plays")} · ${trackGenreName(track, genres)}`.trim()}
                    coverUrl={toAbs(track.coverUrl || "")}
                  />
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="sp-profileSide">
          <section className="sp-card sp-section sp-sideCard sp-sideCard--static">
            <div className="sp-section__head sp-section__head--compact">
              <div>
                <div className="sp-h">{t("studio.recentUploads")}</div>
                <div className="sp-section__sub">{t("studio.recentUploadsSub")}</div>
              </div>
            </div>

            {recentTracks.length === 0 ? (
              <div className="sp-empty">{t("studio.noTracks")}</div>
            ) : (
              <div className="sp-compactList">
                {recentTracks.map((track) => (
                  <Link key={track.id} className="sp-miniTrack" to={`/app/track/${track.id}`}>
                    <CoverArt
                      src={toAbs(track.coverUrl || "")}
                      title={track.title}
                      className="sp-miniTrack__cover"
                    />
                    <div className="sp-miniTrack__main">
                      <div className="sp-miniTrack__title">{track.title}</div>
                      <div className="sp-miniTrack__meta">
                        {trackGenreName(track, genres)} · {track.isActive ? t("studio.published").toLowerCase() : t("studio.hidden").toLowerCase()}
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="sp-card sp-section sp-sideCard sp-sideCard--static">
            <div className="sp-section__head sp-section__head--compact">
              <div>
                <div className="sp-h">{t("profile.followingArtists")}</div>
                <div className="sp-section__sub">{t("studio.followingArtistsSub")}</div>
              </div>
            </div>

            {following.length === 0 ? (
              <div className="sp-empty">{t("profile.notFollowing")}</div>
            ) : (
              <div className="sp-compactList">
                {following.slice(0, 6).map((artist) => {
                  const id = artist.artistId ?? artist.ArtistId;
                  const artistName =
                    artist.artistName ?? artist.ArtistName ?? artist.name ?? artist.Name ?? "Artist";
                  const artistAvatar = artist.avatarUrl ?? artist.AvatarUrl ?? "";

                  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
                  return (
                    <Link key={id} className="sp-personCard" to={`/app/artists/${id}`}>
                      <ArtistAvatar
                        className="sp-personCard__avatar"
                        src={toAbs(artistAvatar)}
                        name={artistName}
                      />
                      <div className="sp-personCard__main">
                        <div className="sp-personCard__title">{artistName}</div>
                        <div className="sp-personCard__meta">{t("profile.artistMeta")}</div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>
        </aside>
      </div>

      <EditProfileModal
        open={profileOpen}
        onClose={() => setProfileOpen(false)}
        me={{ ...me, ...profile, displayName: profile.name }}
        onSaved={async (data) => {
          setProfile((prev) => ({
            ...prev,
            name: data?.name || data?.displayName || prev.name,
            avatarUrl: data?.avatarUrl || prev.avatarUrl || "",
            coverUrl: data?.coverUrl ?? prev.coverUrl,
            slug: data?.slug ?? prev.slug,
          }));
          setProfileOpen(false);
          setToast(text.profileSaved);
          await refreshMe?.();
          await loadProfile();
        }}
        uploadAvatar={async (file) => {
          if (!file) return String(profile.avatarUrl || "").trim();
          if (!isImageFile(file)) {
            throw new Error(text.imageRequired);
          }

          const up = await uploadImageTryEndpoints(file, "avatar");
          if (!up.ok || !up.url) {
            throw new Error(up.error || text.avatarUploadFailed);
          }

          return up.url;
        }}
        buildPayload={({ name, avatarUrl }) => ({
          name,
            coverUrl: String(profile.coverUrl || "").trim() || null,
          slug: String(profile.slug || "").trim() || null,
          avatarUrl: avatarUrl || null,
        })}
        saveProfile={async (payload) => {
          const res = await upsertMyArtistProfile(payload);
          if (!res.ok) {
            throw new Error(res.error || text.saveProfileFailed);
          }
          return res.data || payload;
        }}
        normalizeSavedData={(saved, payload) => ({
          ...saved,
          name: saved?.name || saved?.displayName || payload.name,
          coverUrl: saved?.coverUrl ?? payload.coverUrl ?? profile.coverUrl,
          slug: saved?.slug ?? payload.slug ?? profile.slug,
          avatarUrl: saved?.avatarUrl || payload.avatarUrl || "",
        })}
      />

      <Modal
        open={trackOpen}
        title={form.id ? text.editTrackTitle : text.uploadTrackTitle}
        onClose={!busy ? () => setTrackOpen(false) : undefined}
        closeDisabled={busy}
        contentClassName="modal--md sp-trackModal track-modal--unified"
        bodyClassName="sp-trackModal__body"
        footerClassName="sp-trackModal__footer"
        footer={
          <div className="sp-modalFooterSplit">
            <button
              className="sp-btn"
              onClick={() => {
                resetForm();
                setTrackOpen(false);
              }}
              disabled={busy}
            >
              {text.resetAndClose}
            </button>
            <div className="sp-actions">
              <button className="sp-btn" onClick={() => setTrackOpen(false)} disabled={busy}>
                {text.close}
              </button>
              <button className="sp-btn sp-btn--primary" onClick={saveTrack} disabled={busy}>
                {form.id ? text.save : text.publish}
              </button>
            </div>
          </div>
        }
      >
        <div className="sp-studioTrackForm sp-studioTrackForm--stacked">
          <div className="sp-field sp-field--full">
            <div className="sp-label">{text.trackTitle}</div>
            <input
              className="sp-input"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              placeholder={text.trackTitlePlaceholder}
              maxLength={120}
            />
          </div>

          <div className="sp-field sp-field--full">
            <div className="sp-label">{text.artistName}</div>
            <input className="sp-input" value={displayName} readOnly />
          </div>

          <div className="sp-trackModal__row sp-trackModal__row--double">
            <div className="sp-field">
              <div className="sp-label">{text.genre}</div>
              <PortalSelect
                rootClassName="sp-relative"
                value={form.genreId}
                onChange={(v) => setForm((f) => ({ ...f, genreId: Number(v) }))}
                options={genreSelectOptions}
              />
            </div>

            <div className="sp-field">
              <div className="sp-label">{text.mood}</div>
              <PortalSelect
                rootClassName="sp-relative"
                value={form.moodId}
                onChange={(v) => setForm((f) => ({ ...f, moodId: Number(v) }))}
                options={moodSelectOptions}
              />
            </div>
          </div>

          <div className="sp-trackModal__row sp-trackModal__row--double sp-trackModal__row--uploadsSimple">
            <div className="sp-field">
              <div className="sp-label">{text.trackCover}</div>
              <input
                key={coverInputKey}
                ref={coverInputRef}
                id="artist_cover_input"
                type="file"
                accept={IMAGE_ACCEPT}
                className="u-hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onPickCover(file);
                  setCoverInputKey((k) => k + 1);
                }}
              />
              <button
                type="button"
                className="sp-btn sp-btn--primary sp-trackModal__uploadBtn"
                disabled={coverUploading}
                onClick={() => coverInputRef.current?.click()}
              >
                {coverUploading ? text.loading : text.addCover}
              </button>
              <div className="sp-trackModal__uploadMeta">{coverFileName}</div>
            </div>

            <div className="sp-field">
              <div className="sp-label">{text.track}</div>
              <input
                key={fileInputKey}
                ref={audioInputRef}
                id="artist_mp3_input"
                type="file"
                accept={AUDIO_ACCEPT}
                className="u-hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0] || null;
                  onPickMp3(file);
                  setFileInputKey((k) => k + 1);
                }}
              />
              <button
                type="button"
                className="sp-btn sp-btn--primary sp-trackModal__uploadBtn"
                disabled={uploading}
                onClick={() => audioInputRef.current?.click()}
              >
                {uploading ? text.loading : text.addTrack}
              </button>
              <div className="sp-trackModal__uploadMeta">{audioFileName}</div>
            </div>
          </div>

          <label className="sp-checkRow sp-trackModal__publishToggle">
            <input
              type="checkbox"
              checked={!!form.isActive}
              onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
            />
            <span>{form.isActive ? text.publishNow : text.saveHidden}</span>
          </label>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        title={text.deleteTrackTitle}
        onClose={!busy ? () => setDeleteTarget(null) : undefined}
        closeDisabled={busy}
        contentClassName="modal--sm sp-dialogModal"
        footer={
          <>
            <button className="sp-btn" onClick={() => setDeleteTarget(null)} disabled={busy}>
              {text.cancel}
            </button>
            <button className="sp-btn sp-btn--primary" onClick={confirmDeleteTrack} disabled={busy}>
              {text.delete}
            </button>
          </>
        }
      >
        <div className="sp-dialogText">
          <>{text.delete} <b>{deleteTarget?.title}</b>?</>
        </div>
      </Modal>
    </div>
  );
}

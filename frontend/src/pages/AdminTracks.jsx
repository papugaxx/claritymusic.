

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Modal from "../components/ui/Modal.jsx";
import PortalSelect from "../components/ui/PortalSelect.jsx";
import { uploadFile } from "../services/api.js";
import { createAdminGenre, createAdminMood, createAdminTrack, deleteAdminTrack, getAdminLookups, getAdminTracks, patchAdminTrackStatus, updateAdminTrack } from "../services/adminApi.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { useAppState } from "../context/AppStateContext.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { isAdmin } from "../utils/auth.js";
import { AUDIO_ACCEPT, IMAGE_ACCEPT, validateAudioFile, validateImageFile } from "../services/uploadValidation.js";
import { formatSec, getMp3DurationSec, normName } from "../features/admin/adminTrackUtils.js";

const PAGE_SIZE = 50;


// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function AdminTracks() {
  const nav = useNavigate();
  const location = useLocation();
  const { loading, me } = useAuth();
  const { notifyTracksChanged } = useAppState();
  const { t } = useI18n();

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const hasAdminAccess = useMemo(() => isAdmin(me), [me]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const text = useMemo(() => ({
    lookupLoadFailed: t("adminTracks.lookupLoadFailed"),
    tracksLoadFailed: t("adminTracks.tracksLoadFailed"),
    deleteSelectedTitle: t("adminTracks.deleteSelectedTitle"),
    deleteSelectedMessage: (count) => t("adminTracks.deleteSelectedMessage", { count }),
    mp3Only: t("adminTracks.mp3Only"),
    fileUploadFailed: t("adminTracks.fileUploadFailed"),
    audioUploaded: t("adminTracks.audioUploaded"),
    coverTypesOnly: t("adminTracks.coverTypesOnly"),
    coverUploadFailed: t("adminTracks.coverUploadFailed"),
    coverUploaded: t("adminTracks.coverUploaded"),
    createGenreFailed: t("adminTracks.createGenreFailed"),
    createMoodFailed: t("adminTracks.createMoodFailed"),
    enterTitle: t("adminTracks.enterTitle"),
    titleTooLong: t("adminTracks.titleTooLong"),
    artistRequired: t("adminTracks.artistRequired"),
    chooseGenre: t("adminTracks.chooseGenre"),
    chooseMood: t("adminTracks.chooseMood"),
    uploadAudioFirst: t("adminTracks.uploadAudioFirst"),
    durationPositive: t("adminTracks.durationPositive"),
    resolveIdsFailed: t("adminTracks.resolveIdsFailed"),
    createTrackFailed: t("adminTracks.createTrackFailed"),
    trackCreated: t("adminTracks.trackCreatedSuccess"),
    saveTrackFailed: t("adminTracks.saveTrackFailed"),
    changesSaved: t("adminTracks.changesSaved"),
    statusFailed: t("adminTracks.statusFailed"),
    trackHidden: t("adminTracks.trackHidden"),
    trackPublished: t("adminTracks.trackPublished"),
    deleteTrackTitle: t("adminTracks.deleteTrackTitle"),
    deleteTrackMessage: (title) => t("adminTracks.deleteTrackMessage", { title }),
    deleteManyFailed: (count) => t("adminTracks.deleteManyFailed", { count }),
    deletedMany: (count) => t("adminTracks.deletedMany", { count }),
    deletedOne: t("adminTracks.deletedOne"),
    loading: t("adminTracks.loading"),
    adminPanel: t("adminTracks.adminPanel"),
    accessDenied: t("adminTracks.accessDenied"),
    sortPopular: t("adminTracks.sortPopular"),
    sortTitle: t("adminTracks.sortTitle"),
    chooseOption: t("adminTracks.chooseOption"),
    pageTitle: t("adminTracks.pageTitle"),
    pageSubtitle: t("adminTracks.pageSubtitle"),
    searchPlaceholder: t("adminTracks.searchPlaceholder"),
    activeOnly: t("adminTracks.activeOnly"),
    refresh: t("adminTracks.refresh"),
    deleteSelectedButton: t("adminTracks.deleteSelectedButton"),
    selectRowsFirst: t("adminTracks.selectRowsFirst"),
    newTrack: t("adminTracks.newTrack"),
    selectAllVisible: t("adminTracks.selectAllVisible"),
    colTitle: t("adminTracks.colTitle"),
    colArtist: t("adminTracks.colArtist"),
    colGenre: t("adminTracks.colGenre"),
    colDuration: t("adminTracks.colDuration"),
    colStatus: t("adminTracks.colStatus"),
    colActions: t("adminTracks.colActions"),
    trackPublishedTitle: t("adminTracks.trackPublishedTitle"),
    trackHiddenTitle: t("adminTracks.trackHiddenTitle"),
    statusActive: t("adminTracks.statusActive"),
    statusHidden: t("adminTracks.statusHidden"),
    edit: t("common.edit"),
    hide: t("adminTracks.hide"),
    publish: t("adminTracks.publish"),
    delete: t("common.delete"),
    noTracksYet: t("adminTracks.noTracksYet"),
    editTrackTitle: t("adminTracks.editTrackTitle"),
    newTrackTitle: t("adminTracks.newTrackTitle"),
    clearForm: t("adminTracks.clearForm"),
    saving: t("common.saving"),
    save: t("common.save"),
    trackName: t("adminTracks.trackName"),
    trackNamePlaceholder: t("adminTracks.trackNamePlaceholder"),
    artistName: t("adminTracks.artistName"),
    artistNamePlaceholder: t("adminTracks.artistNamePlaceholder"),
    mood: t("adminTracks.mood"),
    genre: t("adminTracks.genre"),
    audioFile: t("adminTracks.audioFile"),
    addTrack: t("adminTracks.addTrack"),
    trackAdded: t("adminTracks.trackAdded"),
    coverTrack: t("adminTracks.coverTrack"),
    addCover: t("adminTracks.addCover"),
    coverAdded: t("adminTracks.coverAdded"),
    status: t("common.status"),
    cancel: t("common.cancel"),
  }), [t]);

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [tracks, setTracks] = useState([]);
  const [lookups, setLookups] = useState({ artists: [], genres: [], moods: [] });
  const [loadStatus, setLoadStatus] = useState("idle");
  const [hasMoreTracks, setHasMoreTracks] = useState(false);
  const [_nextTracksSkip, setNextTracksSkip] = useState(0);
  const [loadingMoreTracks, setLoadingMoreTracks] = useState(false);
  const nextTracksSkipRef = useRef(0);

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("popular");
  const [activeOnly, setActiveOnly] = useState(false);

  const [selectedIds, setSelectedIds] = useState(() => new Set());

  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const emptyForm = useMemo(
    () => ({
      id: null,
      title: "",
      artistName: "",
      genreName: "",
      moodName: "",
      durationSec: 0,
      audioUrl: "",
      coverUrl: "",
      isActive: true,
    }),
    []
  );

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [form, setForm] = useState(emptyForm);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, ids: [], title: "", message: "", resetsForm: false });
  const [audioPickName, setAudioPickName] = useState("");
  const [coverPickName, setCoverPickName] = useState("");

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadLookups = useCallback(async () => {
    try {
      const lookupsRes = await getAdminLookups();
      if (!lookupsRes.ok || !lookupsRes.data) {
        throw new Error(lookupsRes.error || text.lookupLoadFailed);
      }

      const artists = Array.isArray(lookupsRes.data.artists) ? lookupsRes.data.artists : [];
      let genres = Array.isArray(lookupsRes.data.genres) ? lookupsRes.data.genres : [];
      let moods = Array.isArray(lookupsRes.data.moods) ? lookupsRes.data.moods : [];

      // Нижче зібране локальне обчислення яке використовується у цьому блоці
      const dedupByName = (arr) => {
        const map = new Map();
        for (const x of arr || []) {
          const key = normName(x?.name);
          if (!key) continue;
          if (!map.has(key)) map.set(key, x);
        }
        return Array.from(map.values());
      };

      moods = dedupByName(moods);
      genres = dedupByName(genres);
      const dedupArtists = dedupByName(artists);

      setLookups({
        artists: dedupArtists,
        genres,
        moods,
      });

    } catch (e) {
      setLookups({ artists: [], genres: [], moods: [] });
      setToast(e?.message || text.lookupLoadFailed);
    }
  }, [text.lookupLoadFailed]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const loadTracks = useCallback(async ({ append = false } = {}) => {
    if (!append) {
      nextTracksSkipRef.current = 0;
      setNextTracksSkip(0);
      setLoadStatus("loading");
    } else {
      setLoadingMoreTracks(true);
    }

    const skip = append ? nextTracksSkipRef.current : 0;

    try {
      const res = await getAdminTracks({
        q: q || undefined,
        sort,
        activeOnly,
        take: PAGE_SIZE,
        skip,
      });
      if (!res.ok) {
        if (!append) {
          nextTracksSkipRef.current = 0;
          setTracks([]);
          setHasMoreTracks(false);
          setNextTracksSkip(0);
          setLoadStatus("hard-error");
        }
        setToast(res.error || text.tracksLoadFailed);
        return;
      }

      const page = res.data || {};
      const nextTracks = Array.isArray(page.items) ? page.items : [];
      const resolvedNextSkip = Number.isFinite(Number(page.nextSkip)) ? Number(page.nextSkip) : skip + nextTracks.length;
      nextTracksSkipRef.current = resolvedNextSkip;
      setTracks((prev) => (append ? [...prev, ...nextTracks] : nextTracks));
      setHasMoreTracks(!!page.hasMore);
      setNextTracksSkip(resolvedNextSkip);
      setLoadStatus(nextTracks.length > 0 || append || skip > 0 ? "success" : "empty");
      if (!append) setSelectedIds(new Set());
    } catch (e) {
      if (!append) {
        nextTracksSkipRef.current = 0;
        setTracks([]);
        setHasMoreTracks(false);
        setNextTracksSkip(0);
        setLoadStatus("hard-error");
      }
      setToast(e?.message || text.tracksLoadFailed);
    } finally {
      if (append) setLoadingMoreTracks(false);
    }
  }, [activeOnly, q, sort, text.tracksLoadFailed]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const startCreate = useCallback(() => {
    setForm(emptyForm);
    setAudioPickName("");
    setCoverPickName("");
    setModalOpen(true);
  }, [emptyForm]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (loading) return;

    if (!me?.isAuthenticated) {
      nav("/login", { replace: true });
      return;
    }

    if (hasAdminAccess) {
      loadLookups();

      const params = new URLSearchParams(location.search);
      if (params.get("new") === "1") {
        startCreate();
        params.delete("new");
        nav({ pathname: location.pathname, search: params.toString() ? `?${params}` : "" }, { replace: true });
      }
    }
  }, [loading, me, hasAdminAccess, nav, location.pathname, location.search, loadLookups, startCreate]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (loading || !hasAdminAccess) return undefined;
    const timer = window.setTimeout(() => {
      void loadTracks({ append: false });
    }, 220);
    return () => window.clearTimeout(timer);
  }, [activeOnly, hasAdminAccess, loadTracks, loading, q, sort]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function toggleOne(id, checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function toggleAllVisible(checked) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (checked) visibleTracks.forEach((t) => next.add(t.id));
      else visibleTracks.forEach((t) => next.delete(t.id));
      return next;
    });
  }

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const visibleTracks = useMemo(() => tracks, [tracks]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const allVisibleSelected = useMemo(() => {
    if (visibleTracks.length === 0) return false;
    return visibleTracks.every((t) => selectedIds.has(t.id));
  }, [visibleTracks, selectedIds]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const someVisibleSelected = useMemo(() => {
    if (visibleTracks.length === 0) return false;
    return visibleTracks.some((t) => selectedIds.has(t.id));
  }, [visibleTracks, selectedIds]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function deleteSelected() {
    const ids = Array.from(selectedIds);
    if (ids.length === 0) return;

    setDeleteDialog({
      open: true,
      ids,
      title: text.deleteSelectedTitle,
      message: text.deleteSelectedMessage(ids.length),
      resetsForm: false,
    });
  }

  
  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function startEdit(t) {
    setModalOpen(true);
    setAudioPickName("");
    setCoverPickName("");
    setForm({
      id: t.id,
      title: t.title || "",
      artistName: t.artist?.name || "",
      genreName: t.genre?.name || "",
      moodName: t.mood?.name || t.moodName || "",
      durationSec: Number(t.durationSec ?? 0),
      audioUrl: t.audioUrl || "",
      coverUrl: t.coverUrl || "",
      isActive: !!t.isActive,
    });
  }

  async function uploadMp3(file) {
    if (!file) return;

    setAudioPickName(file.name || "");

    const validationError = validateAudioFile(file, { maxBytes: 25_000_000 });
    if (validationError) {
      setToast(validationError || text.mp3Only);
      return;
    }

    setBusy(true);
    try {
      const d = await getMp3DurationSec(file);
      if (d) setForm((prev) => ({ ...prev, durationSec: d }));

      const res = await uploadFile("/api/uploads/audio", file);
      if (!res.ok) {
        setToast(res.error || text.fileUploadFailed);
        return;
      }

      const audioUrl = res.data?.audioUrl || res.data?.url || "";
      setForm((prev) => ({ ...prev, audioUrl }));
      setToast(text.audioUploaded);
    } catch (e) {
      setToast(e?.message || text.fileUploadFailed);
    } finally {
      setBusy(false);
    }
  }

  async function uploadCover(file) {
    if (!file) return;

    setCoverPickName(file.name || "");

    const validationError = validateImageFile(file, { maxBytes: 8_000_000 });
    if (validationError) {
      setToast(validationError || text.coverTypesOnly);
      return;
    }

    setBusy(true);
    try {
      const res = await uploadFile("/api/uploads/cover", file);
      if (!res.ok) {
        setToast(res.error || text.coverUploadFailed);
        return;
      }

      const coverUrl = res.data?.coverUrl || res.data?.url || "";

      setForm((prev) => ({ ...prev, coverUrl }));
      setToast(text.coverUploaded);
    } catch (e) {
      setToast(e?.message || text.coverUploadFailed);
    } finally {
      setBusy(false);
    }
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function findExistingIdByName(list, name) {
    const n = normName(name);
    if (!n) return null;
    const item = list.find((x) => normName(x?.name) === n);
    return item?.id ?? null;
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function resolveArtistIdByName(name) {
    return findExistingIdByName(lookups.artists, name);
  }

  async function ensureGenreIdByName(name) {
    const existingId = findExistingIdByName(lookups.genres, name);
    if (existingId) return existingId;

    const attempts = [createAdminGenre];
    let createdId = null;
    let lastErr = "";

    for (const createGenre of attempts) {
      const r = await createGenre(String(name || "").trim());
      if (r.ok) {
        createdId = r.data?.id ?? null;
        break;
      }
      lastErr = r.error || lastErr;
    }

    if (!createdId) throw new Error(lastErr || text.createGenreFailed);

    await loadLookups();
    return createdId;
  }

  async function ensureMoodIdByName(name) {
    const existingId = findExistingIdByName(lookups.moods, name);
    if (existingId) return existingId;

    const attempts = [createAdminMood];
    let createdId = null;
    let lastErr = "";

    for (const createMood of attempts) {
      const r = await createMood(String(name || "").trim());
      if (r.ok) {
        createdId = r.data?.id ?? null;
        break;
      }
      lastErr = r.error || lastErr;
    }

    if (!createdId) throw new Error(lastErr || text.createMoodFailed);

    await loadLookups();
    return createdId;
  }

  async function save() {
    setBusy(true);
    try {
      const title = (form.title || "").trim();
      const artistName = (form.artistName || "").trim();
      const genreName = (form.genreName || "").trim();
      const moodName = (form.moodName || "").trim();
      const audioUrl = (form.audioUrl || "").trim();
      const coverUrl = (form.coverUrl || "").trim();
      const durationSec = Number(form.durationSec || 0);

      if (!title) { setToast(text.enterTitle); return false; }
      if (title.length > 120) { setToast(text.titleTooLong); return false; }
      if (!artistName) { setToast(text.artistRequired); return false; }
      if (!genreName) { setToast(text.chooseGenre); return false; }
      if (!moodName) { setToast(text.chooseMood); return false; }
      if (!audioUrl) { setToast(text.uploadAudioFirst); return false; }
      if (!durationSec || durationSec < 1) { setToast(text.durationPositive); return false; }

      const artistId = resolveArtistIdByName(artistName);
      const genreId = await ensureGenreIdByName(genreName);
      const moodId = await ensureMoodIdByName(moodName);

      if (!genreId || !moodId) { setToast(text.resolveIdsFailed); return false; }

      const payload = {
        title,
        artistName,
        ...(artistId ? { artistId: Number(artistId) } : {}),
        genreId: Number(genreId),
        moodId: Number(moodId),
        durationSec,
        audioUrl,
        coverUrl: coverUrl || null,
        isActive: !!form.isActive,
      };

      if (!form.id) {
        const res = await createAdminTrack(payload);
        if (!res.ok) { setToast(res.error || text.createTrackFailed); return false; }
        setToast(text.trackCreated);
        notifyTracksChanged();
      } else {
        const res = await updateAdminTrack(form.id, payload);
        if (!res.ok) { setToast(res.error || text.saveTrackFailed); return false; }
        setToast(text.changesSaved);
        notifyTracksChanged();
      }

      await loadTracks();
      startCreate();
      return true;
    } catch (e) {
      setToast(e?.message || text.saveTrackFailed);
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function toggleStatus(t) {
    setBusy(true);
    try {
      const res = await patchAdminTrackStatus(t.id, !t.isActive);
      if (!res.ok) {
        setToast(res.error || text.statusFailed);
        return;
      }
      setToast(t.isActive ? text.trackHidden : text.trackPublished);
      await loadTracks();
      if (form.id === t.id) setForm((prev) => ({ ...prev, isActive: !t.isActive }));
      notifyTracksChanged();
    } finally {
      setBusy(false);
    }
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function deleteTrack(t) {
    setDeleteDialog({
      open: true,
      ids: [t.id],
      title: text.deleteTrackTitle,
      message: text.deleteTrackMessage(t.title),
      resetsForm: form.id === t.id,
    });
  }

  async function confirmDeleteTracks() {
    const ids = deleteDialog.ids || [];
    if (ids.length === 0) return;

    setBusy(true);
    try {
      const results = await Promise.all(ids.map((id) => deleteAdminTrack(id)));
      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        setToast(failed[0].error || text.deleteManyFailed(failed.length));
        return;
      }

      setToast(ids.length > 1 ? text.deletedMany(ids.length) : text.deletedOne);
      await loadTracks();
      if (deleteDialog.resetsForm) startCreate();
      notifyTracksChanged();
      setDeleteDialog({ open: false, ids: [], title: "", message: "", resetsForm: false });
    } finally {
      setBusy(false);
    }
  }

  if (loading) return <div className="admin-pageState">{text.loading}</div>;

  if (!hasAdminAccess) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div className="admin-pageState admin-pageState--denied">
        <h2 className="admin-pageState__title">{text.adminPanel}</h2>
        <p>{text.accessDenied}</p>
      </div>
    );
  }

  const sortOptions = [
    { value: "popular", label: text.sortPopular },
    { value: "title", label: text.sortTitle },
  ];

  const genreOptions = [{ value: "", label: text.chooseOption }, ...lookups.genres.map((g) => ({ value: g.name, label: g.name }))];
  const moodOptions = [{ value: "", label: text.chooseOption }, ...lookups.moods.map((m) => ({ value: m.name, label: m.name }))];

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="admin-card">
      <div className="admin-card__head">
        <div>
          <div className="admin-title">{text.pageTitle}</div>
          <div className="admin-subtitle">{text.pageSubtitle}</div>
        </div>

        <div className="admin-toolbar">
          <input
            className="admin-input admin-toolbar__search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={text.searchPlaceholder}
          />

          <PortalSelect rootClassName="admin-select-wrap" value={sort} onChange={setSort} options={sortOptions} />

          <label className="admin-toolbar__toggle">
            <input
              type="checkbox"
              checked={activeOnly}
              onChange={(e) => setActiveOnly(e.target.checked)}
            />
            {text.activeOnly}
          </label>

          <button
            className="admin-btn admin-btn--ghost"
            onClick={() => loadTracks()}
            disabled={busy}
            type="button"
          >
            {text.refresh}
          </button>

          <button
            className="admin-btn admin-btn--ghost"
            onClick={deleteSelected}
            disabled={busy || selectedIds.size === 0}
            type="button"
            title={selectedIds.size ? `${text.deleteSelectedButton} (${selectedIds.size})` : text.selectRowsFirst}
          >
            {text.deleteSelectedButton}
          </button>

          <button className="admin-btn" onClick={startCreate} disabled={busy} type="button">
            {text.newTrack}
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-table__check">
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) el.indeterminate = !allVisibleSelected && someVisibleSelected;
                  }}
                  onChange={(e) => toggleAllVisible(e.target.checked)}
                  aria-label={text.selectAllVisible}
                />
              </th>
              <th className="admin-table__id">ID</th>
              <th>{text.colTitle}</th>
              <th>{text.colArtist}</th>
              <th>{text.colGenre}</th>
              <th className="admin-table__duration">{text.colDuration}</th>
              <th className="admin-table__statusCol">{text.colStatus}</th>
              <th className="admin-table__actionsCol">{text.colActions}</th>
            </tr>
          </thead>

          <tbody>
            {visibleTracks.map((t) => (
              <tr key={t.id}>
                <td className="admin-table__checkCell">
                  <input type="checkbox" checked={selectedIds.has(t.id)} onChange={(e) => toggleOne(t.id, e.target.checked)} />
                </td>

                <td className="admin-table__muted">{t.id}</td>

                <td className="admin-table__titleCell">
                  <div>{t.title}</div>
                  <div className="admin-table__subline">{t.audioUrl || "—"}</div>
                </td>

                <td>{t.artist?.name || "—"}</td>
                <td>{t.genre?.name || "—"}</td>
                <td>{formatSec(t.durationSec)}</td>

                <td>
                  <span
                    className={`admin-status ${t.isActive ? "is-active" : "is-inactive"}`}
                    title={t.isActive ? text.trackPublishedTitle : text.trackHiddenTitle}
                  >
                    {t.isActive ? text.statusActive : text.statusHidden}
                  </span>
                </td>

                <td>
                  <div className="admin-actions">
                    <button className="admin-iconbtn" title={text.edit} onClick={() => startEdit(t)} disabled={busy} type="button">
                      ✎
                    </button>
                    <button
                      className="admin-iconbtn"
                      title={t.isActive ? text.hide : text.publish}
                      onClick={() => toggleStatus(t)}
                      disabled={busy}
                      type="button"
                    >
                      {t.isActive ? "⏻" : "▶"}
                    </button>
                    <button className="admin-iconbtn" title={text.delete} onClick={() => deleteTrack(t)} disabled={busy} type="button">
                      ✕
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {visibleTracks.length === 0 && (
              <tr>
                <td colSpan={8} className="admin-table__empty">
                  {loadStatus === "loading"
                    ? text.loading
                    : loadStatus === "hard-error"
                      ? `⚠ ${toast || text.tracksLoadFailed}`
                      : text.noTracksYet}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {hasMoreTracks ? (
        <div className="home__actions">
          <button className="admin-btn admin-btn--ghost" onClick={() => void loadTracks({ append: true })} disabled={busy || loadingMoreTracks} type="button">
            {loadingMoreTracks ? text.loading : t("common.loadMore")}
          </button>
        </div>
      ) : null}

      <Modal
        open={modalOpen}
        title={form.id ? text.editTrackTitle : text.newTrackTitle}
        contentClassName="modal--md admin-trackModal track-modal--unified"
        onClose={!busy ? () => setModalOpen(false) : undefined}
        closeDisabled={busy}
        footer={
          <>
            <button className="admin-btn admin-btn--ghost" onClick={() => setForm(emptyForm)} disabled={busy} type="button">
              {text.clearForm}
            </button>
            <button
              className="admin-btn"
              onClick={async () => {
                const ok = await save();
                if (ok) setModalOpen(false);
              }}
              disabled={busy}
              type="button"
            >
              {busy ? text.saving : text.save}
            </button>
          </>
        }
      >
        <div className="admin-form-grid">
          <div className="admin-field admin-field--full">
            <div className="admin-label">{text.trackName}</div>
            <input className="admin-input" value={form.title} maxLength={120} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))} placeholder={text.trackNamePlaceholder} />
            </div>

          <div className="admin-field admin-field--full">
            <div className="admin-label">{text.artistName}</div>
            <input
              className="admin-input"
              list="artistsList"
              value={form.artistName}
              onChange={(e) => setForm((p) => ({ ...p, artistName: e.target.value }))}
              placeholder={text.artistNamePlaceholder}
              maxLength={80}
            />
            <datalist id="artistsList">
              {lookups.artists.map((a) => (
                <option key={a.id} value={a.name} />
              ))}
            </datalist>
          </div>

          <div className="admin-field">
            <div className="admin-label">{text.mood}</div>
            <PortalSelect
              rootClassName="admin-select-wrap"
              value={form.moodName}
              onChange={(v) => setForm((p) => ({ ...p, moodName: String(v ?? "") }))}
              options={moodOptions}
              align="left"
            />
          </div>

          <div className="admin-field">
            <div className="admin-label">{text.genre}</div>
            <PortalSelect
              rootClassName="admin-select-wrap"
              value={form.genreName}
              onChange={(v) => setForm((p) => ({ ...p, genreName: String(v ?? "") }))}
              options={genreOptions}
              align="left"
            />
          </div>

          <div className="admin-field admin-field--full admin-trackModal__uploads">
            <div className="admin-field admin-trackModal__uploadCell">
              <div className="admin-label">{text.audioFile}</div>
              <label className="admin-btn admin-trackModal__uploadBtn">
                {text.addTrack}
                <input className="admin-file__input" type="file" accept={AUDIO_ACCEPT} onChange={(e) => uploadMp3(e.target.files?.[0] || null)} />
              </label>
              <div className="admin-trackModal__uploadMeta">{audioPickName}</div>
            </div>

            <div className="admin-field admin-trackModal__uploadCell">
              <div className="admin-label">{text.coverTrack}</div>
              <label className="admin-btn admin-trackModal__uploadBtn">
                {text.addCover}
                <input className="admin-file__input" type="file" accept={IMAGE_ACCEPT} onChange={(e) => uploadCover(e.target.files?.[0] || null)} />
              </label>
              <div className="admin-trackModal__uploadMeta">{coverPickName}</div>
            </div>
          </div>

          <div className="admin-field">
            <div className="admin-label">{text.status}</div>
            <label className="admin-check admin-check--spaced">
              <input
                type="checkbox"
                checked={!!form.isActive}
                onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.checked }))}
              />
              <span>{form.isActive ? text.statusActive : text.statusHidden}</span>
            </label>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteDialog.open}
        title={deleteDialog.title}
        onClose={!busy ? () => setDeleteDialog({ open: false, ids: [], title: "", message: "", resetsForm: false }) : undefined}
        closeDisabled={busy}
        contentClassName="modal--sm"
        footer={
          <>
            <button
              className="admin-btn admin-btn--ghost"
              onClick={() => setDeleteDialog({ open: false, ids: [], title: "", message: "", resetsForm: false })}
              disabled={busy}
              type="button"
            >
              {text.cancel}
            </button>
            <button className="admin-btn" onClick={confirmDeleteTracks} disabled={busy} type="button">
              {text.delete}
            </button>
          </>
        }
      >
        <div className="admin-dialogText">{deleteDialog.message}</div>
      </Modal>

      {!!toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

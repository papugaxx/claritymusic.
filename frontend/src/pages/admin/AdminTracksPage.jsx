

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { uploadFile } from "../../services/api.js";
import { CoverArt } from "../../ui/CoverArt.jsx";
import { Field } from "../../ui/Field.jsx";
import { Modal } from "../../ui/Modal.jsx";
import { SelectField } from "../../ui/SelectField.jsx";
import { AUDIO_ACCEPT, IMAGE_ACCEPT, validateAudioFile, validateImageFile } from "../../services/uploadValidation.js";
import {
  createAdminTrack,
  deleteAdminTrack,
  getAdminLookups,
  getAdminTracks,
  patchAdminTrackStatus,
  updateAdminTrack,
} from "../../services/adminApi.js";
import styles from "./AdminPage.module.css";

const EMPTY_FORM = {
  id: null,
  title: "",
  artistId: "",
  genreId: "",
  moodId: "",
  durationSec: "",
  audioUrl: "",
  coverUrl: "",
  isActive: true,
};

// Функція нижче інкапсулює окрему частину логіки цього модуля
function readAudioDurationSec(file) {
  return new Promise((resolve) => {
    if (typeof window === "undefined" || typeof Audio === "undefined" || !file) {
      resolve(0);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const audio = new Audio();

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function cleanup(nextValue = 0) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch 
      resolve(Number.isFinite(nextValue) ? Math.max(0, Math.round(nextValue)) : 0);
    }

    audio.preload = "metadata";
    audio.src = objectUrl;
    audio.onloadedmetadata = () => cleanup(audio.duration || 0);
    audio.onerror = () => cleanup(0);
  });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizePayload(form) {
  return {
    title: String(form.title || "").trim(),
    artistId: Number(form.artistId || 0),
    genreId: Number(form.genreId || 0),
    moodId: form.moodId ? Number(form.moodId) : null,
    durationSec: Number(form.durationSec || 0),
    audioUrl: String(form.audioUrl || "").trim(),
    coverUrl: String(form.coverUrl || "").trim() || null,
    isActive: Boolean(form.isActive),
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function UploadCard({
  label,
  buttonLabel,
  accept,
  busy,
  meta,
  onPick,
  preview = null,
  path = "",
}) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={styles.uploadCard}>
      <div className={styles.uploadHead}>
        <span className={styles.uploadLabel}>{label}</span>
        {path ? <span className={styles.uploadState}>ready</span> : null}
      </div>

      {preview}

      <label className={`secondaryButton ${styles.uploadTrigger} ${busy ? styles.uploadTriggerBusy : ""}`.trim()}>
        <input
          className={styles.fileInput}
          type="file"
          accept={accept}
          onChange={(event) => {
            const file = event.target.files?.[0] || null;
            onPick?.(file);
            event.target.value = "";
          }}
          disabled={busy}
        />
        {busy ? "Uploading…" : buttonLabel}
      </label>

      <div className={styles.uploadMeta}>{meta}</div>
      {path ? <div className={styles.assetPath}>{path}</div> : null}
    </div>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AdminTracksPage() {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [tracks, setTracks] = useState([]);
  const [lookups, setLookups] = useState({ artists: [], genres: [], moods: [] });
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("popular");
  const [activeOnly, setActiveOnly] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editorOpen, setEditorOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [uploadBusy, setUploadBusy] = useState("");
  const [audioPickName, setAudioPickName] = useState("");
  const [coverPickName, setCoverPickName] = useState("");

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const refresh = useCallback(async () => {
    setBusy(true);
    const [tracksResponse, lookupsResponse] = await Promise.all([
      getAdminTracks({ q: query || undefined, sort, activeOnly, take: 100, skip: 0 }),
      getAdminLookups(),
    ]);
    setBusy(false);

    if (!lookupsResponse?.ok) {
      setLookups({ artists: [], genres: [], moods: [] });
      setMessage(lookupsResponse?.error || "Failed to load admin lookups");
    } else {
      setLookups({
        artists: Array.isArray(lookupsResponse.data?.artists) ? lookupsResponse.data.artists : [],
        genres: Array.isArray(lookupsResponse.data?.genres) ? lookupsResponse.data.genres : [],
        moods: Array.isArray(lookupsResponse.data?.moods) ? lookupsResponse.data.moods : [],
      });
    }

    if (!tracksResponse?.ok) {
      setTracks([]);
      setMessage(tracksResponse?.error || "Failed to load tracks");
      return;
    }

    setTracks(Array.isArray(tracksResponse.data?.items) ? tracksResponse.data.items : []);
    setMessage("");
  }, [query, sort, activeOnly]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const artistOptions = useMemo(
    () => lookups.artists.map((artist) => ({ value: String(artist.id), label: artist.name })),
    [lookups.artists],
  );
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const genreOptions = useMemo(
    () => lookups.genres.map((genre) => ({ value: String(genre.id), label: genre.name })),
    [lookups.genres],
  );
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const moodOptions = useMemo(
    () => lookups.moods.map((mood) => ({ value: String(mood.id), label: mood.name })),
    [lookups.moods],
  );

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function resetEditorState(nextForm) {
    setForm(nextForm);
    setAudioPickName("");
    setCoverPickName("");
    setUploadBusy("");
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function openCreate() {
    resetEditorState(EMPTY_FORM);
    setEditorOpen(true);
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function openEdit(track) {
    resetEditorState({
      id: track.id,
      title: track.title || "",
      artistId: String(track.artistId || track.artist?.id || ""),
      genreId: String(track.genreId || track.genre?.id || ""),
      moodId: String(track.moodId || track.mood?.id || ""),
      durationSec: String(track.durationSec || ""),
      audioUrl: track.audioUrl || "",
      coverUrl: track.coverUrl || "",
      isActive: track.isActive !== false,
    });
    setEditorOpen(true);
  }

  async function handleAudioPick(file) {
    if (!file) return;
    const error = validateAudioFile(file, { maxBytes: 25_000_000 });
    if (error) {
      setMessage(error);
      return;
    }

    setUploadBusy("audio");
    setAudioPickName(file.name || "");
    const [response, detectedDuration] = await Promise.all([
      uploadFile("/api/uploads/audio", file),
      readAudioDurationSec(file),
    ]);
    setUploadBusy("");

    if (!response?.ok) {
      setMessage(response?.error || "Failed to upload audio");
      return;
    }

    const audioUrl = response.data?.audioUrl || response.data?.url || "";
    setForm((current) => ({
      ...current,
      audioUrl,
      durationSec: String(detectedDuration || current.durationSec || ""),
    }));
    setMessage("Track file uploaded ✅");
  }

  async function handleCoverPick(file) {
    if (!file) return;
    const error = validateImageFile(file, { maxBytes: 8_000_000 });
    if (error) {
      setMessage(error);
      return;
    }

    setUploadBusy("cover");
    setCoverPickName(file.name || "");
    const response = await uploadFile("/api/uploads/cover", file);
    setUploadBusy("");

    if (!response?.ok) {
      setMessage(response?.error || "Failed to upload cover");
      return;
    }

    const coverUrl = response.data?.coverUrl || response.data?.url || "";
    setForm((current) => ({ ...current, coverUrl }));
    setMessage("Cover uploaded ✅");
  }

  async function handleSave(event) {
    event?.preventDefault?.();
    const payload = normalizePayload(form);
    if (!payload.title || !payload.artistId || !payload.genreId || payload.durationSec <= 0 || !payload.audioUrl) {
      setMessage("Title, artist, genre, duration and track file are required.");
      return;
    }
    setBusy(true);
    const response = form.id ? await updateAdminTrack(form.id, payload) : await createAdminTrack(payload);
    setBusy(false);
    if (!response?.ok) {
      setMessage(response?.error || "Failed to save track");
      return;
    }
    setEditorOpen(false);
    resetEditorState(EMPTY_FORM);
    setMessage(form.id ? "Track updated." : "Track created.");
    refresh();
  }

  async function handleStatus(track) {
    setBusy(true);
    const response = await patchAdminTrackStatus(track.id, !track.isActive);
    setBusy(false);
    if (!response?.ok) {
      setMessage(response?.error || "Failed to update track status");
      return;
    }
    setMessage(track.isActive ? "Track hidden." : "Track published.");
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setBusy(true);
    const response = await deleteAdminTrack(deleteTarget.id);
    setBusy(false);
    if (!response?.ok) {
      setMessage(response?.error || "Failed to delete track");
      return;
    }
    setDeleteTarget(null);
    setMessage("Track deleted.");
    refresh();
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={styles.page}>
      <section className={styles.tableCard}>
        <div className={styles.sectionLead}>
          <div>
            <h1 className={styles.sectionTitle}>Tracks</h1>
            <p className={styles.sectionSubtitle}>Upload, edit, publish and delete tracks.</p>
          </div>
          <button type="button" className="primaryButton" onClick={openCreate}>Add track</button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarGrow}>
            <Field value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search tracks…" />
          </div>
          <SelectField
            value={sort}
            onChange={setSort}
            placeholder={null}
            options={[
              { value: "popular", label: "Popular first" },
              { value: "title", label: "Title" },
            ]}
            width={176}
          />
          <button type="button" className={`ghostButton ${activeOnly ? "is-selected" : ""}`.trim()} onClick={() => setActiveOnly((value) => !value)}>Active only</button>
          <button type="button" className="ghostButton" onClick={refresh}>Refresh</button>
        </div>

        {message ? <div className="inlineMessage">{message}</div> : null}

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Track</th>
                <th>Artist</th>
                <th>Genre</th>
                <th>Mood</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id}>
                  <td>
                    <div className={styles.trackCell}>
                      <CoverArt src={track.coverUrl} title={track.title} className={styles.trackCover} />
                      <div className={styles.trackMeta}>
                        <strong>{track.title}</strong>
                        <span>ID: {track.id} • Plays: {track.playsCount || 0}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <div className={styles.artistMeta}>
                      <strong>{track.artistName || track.artist?.name || "—"}</strong>
                    </div>
                  </td>
                  <td>{track.genreName || track.genre?.name || "—"}</td>
                  <td>{track.moodName || track.mood?.name || "—"}</td>
                  <td>{Math.floor(Number(track.durationSec || 0) / 60)}:{String(Number(track.durationSec || 0) % 60).padStart(2, "0")}</td>
                  <td>
                    <span className={`${styles.pill} ${track.isActive ? styles.pillActive : styles.pillMuted}`.trim()}>
                      {track.isActive ? "Published" : "Hidden"}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button type="button" className="ghostButton" onClick={() => openEdit(track)}>Edit</button>
                      <button type="button" className="ghostButton" onClick={() => handleStatus(track)}>{track.isActive ? "Hide" : "Publish"}</button>
                      <button type="button" className="ghostButton" onClick={() => setDeleteTarget(track)}>Delete</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!busy && !tracks.length ? (
                <tr>
                  <td colSpan="7" className={styles.empty}>No tracks found.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <Modal title={form.id ? "Edit track" : "New track"} open={editorOpen} onClose={() => { if (!busy && !uploadBusy) setEditorOpen(false); }}>
        <form className={styles.modalBody} onSubmit={handleSave}>
          <div className={styles.formGrid}>
            <Field label="Track title" value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} placeholder="Track title" autoFocus />
            <div className={styles.splitFields}>
              <SelectField label="Artist" value={form.artistId} onChange={(value) => setForm((current) => ({ ...current, artistId: value }))} options={artistOptions} placeholder="Select artist" />
              <SelectField label="Genre" value={form.genreId} onChange={(value) => setForm((current) => ({ ...current, genreId: value }))} options={genreOptions} placeholder="Select genre" />
            </div>
            <div className={styles.thirdFields}>
              <SelectField label="Mood" value={form.moodId} onChange={(value) => setForm((current) => ({ ...current, moodId: value }))} options={moodOptions} placeholder="Optional mood" />
              <Field label="Duration (sec)" type="number" value={form.durationSec} onChange={(event) => setForm((current) => ({ ...current, durationSec: event.target.value }))} placeholder="196" />
              <label className="checkboxRow">
                <input type="checkbox" checked={form.isActive} onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))} />
                <span>Published</span>
              </label>
            </div>

            <div className={styles.uploadGrid}>
              <UploadCard
                label="Track file"
                buttonLabel={form.audioUrl ? "Replace track" : "Choose track"}
                accept={AUDIO_ACCEPT}
                busy={uploadBusy === "audio"}
                meta={audioPickName || (form.audioUrl ? "Track uploaded" : "MP3 • up to 25 MB")}
                path={form.audioUrl}
                onPick={handleAudioPick}
              />

              <UploadCard
                label="Cover art"
                buttonLabel={form.coverUrl ? "Replace cover" : "Choose cover"}
                accept={IMAGE_ACCEPT}
                busy={uploadBusy === "cover"}
                meta={coverPickName || (form.coverUrl ? "Cover uploaded" : "PNG, JPG or WEBP")}
                path={form.coverUrl}
                onPick={handleCoverPick}
                preview={
                  <div className={styles.coverPreviewWrap}>
                    <CoverArt src={form.coverUrl} title={form.title || "Cover preview"} className={styles.coverPreview} />
                  </div>
                }
              />
            </div>
          </div>
          <div className="buttonRow buttonRow--end">
            <button type="button" className="ghostButton" onClick={() => setEditorOpen(false)} disabled={busy || Boolean(uploadBusy)}>Cancel</button>
            <button type="submit" className="primaryButton" disabled={busy || Boolean(uploadBusy)}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>

      <Modal title="Delete track" open={Boolean(deleteTarget)} onClose={() => { if (!busy) setDeleteTarget(null); }}>
        <div className={styles.modalBody}>
          <div className={styles.confirmText}>Delete <strong>{deleteTarget?.title}</strong>?</div>
          <div className="buttonRow buttonRow--end">
            <button type="button" className="ghostButton" onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</button>
            <button type="button" className="primaryButton primaryButton--danger" onClick={handleDelete} disabled={busy}>{busy ? "Deleting…" : "Delete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

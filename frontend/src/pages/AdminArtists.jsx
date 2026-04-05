

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../components/ui/Modal.jsx";
import CoverArt from "../components/media/CoverArt.jsx";
import ArtistAvatar from "../components/media/ArtistAvatar.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { uploadFile } from "../services/api.js";
import { createAdminArtist, deleteAdminArtist, getAdminArtists, updateAdminArtist } from "../services/adminApi.js";
import { IMAGE_ACCEPT, validateImageFile } from "../services/uploadValidation.js";

const EMPTY_FORM = {
  id: null,
  name: "",
  slug: "",
  ownerUserId: "",
  avatarUrl: "",
  coverUrl: "",
};

const PAGE_SIZE = 200;
const MAX_ARTISTS_PAGES = 1000;

// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeArtist(value) {
  return {
    id: value?.id ?? null,
    name: value?.name || "",
    slug: value?.slug || "",
    ownerUserId: value?.ownerUserId || "",
    avatarUrl: value?.avatarUrl || "",
    coverUrl: value?.coverUrl || "",
    tracksCount: Number(value?.tracksCount || 0),
    followersCount: Number(value?.followersCount || 0),
  };
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function AdminArtists() {
  const { t } = useI18n();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [artists, setArtists] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const load = useCallback(async () => {
    setBusy(true);
    try {
      let skip = 0;
      let pageCount = 0;
      let hasMore = true;
      const allItems = [];

      while (hasMore && pageCount < MAX_ARTISTS_PAGES) {
        const res = await getAdminArtists({ take: PAGE_SIZE, skip });
        if (!res.ok) {
          setArtists([]);
          setToast(res.error || t("admin.artistsLoadFailed", "Не вдалося завантажити артистів"));
          return;
        }

        const page = res.data || {};
        const items = Array.isArray(page.items) ? page.items : [];
        allItems.push(...items);

        hasMore = !!page.hasMore;
        skip = Number.isFinite(Number(page.nextSkip)) ? Number(page.nextSkip) : skip + items.length;
        pageCount += 1;

        if (items.length === 0) {
          hasMore = false;
        }
      }

      setArtists(allItems.map(normalizeArtist));
    } finally {
      setBusy(false);
    }
  }, [t]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    load();
  }, [load]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(""), 2600);
    return () => clearTimeout(timer);
  }, [toast]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const visible = useMemo(() => {
    const term = String(q || "").trim().toLowerCase();
    if (!term) return artists;
    return artists.filter((artist) => {
      return [artist.name, artist.slug, artist.ownerUserId, String(artist.id)]
        .some((value) => String(value || "").toLowerCase().includes(term));
    });
  }, [artists, q]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function resetForm() {
    setForm(EMPTY_FORM);
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function startCreate() {
    resetForm();
    setModalOpen(true);
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function startEdit(artist) {
    setForm(normalizeArtist(artist));
    setModalOpen(true);
  }

  async function uploadImage(kind, file) {
    const maxBytes = kind === "avatar" ? 5_000_000 : 8_000_000;
    const validationError = validateImageFile(file, { maxBytes });
    if (validationError) {
      setToast(validationError);
      return;
    }

    setBusy(true);
    try {
      const res = await uploadFile(kind === "avatar" ? "/api/uploads/avatar" : "/api/uploads/cover", file);
      if (!res.ok) {
        setToast(res.error || t("upload.failed", "Не вдалося завантажити файл"));
        return;
      }

      const nextUrl = res.data?.avatarUrl || res.data?.coverUrl || res.data?.url || "";
      if (!nextUrl) {
        setToast(t("upload.failed", "Не вдалося завантажити файл"));
        return;
      }

      setForm((prev) => ({ ...prev, [kind === "avatar" ? "avatarUrl" : "coverUrl"]: nextUrl }));
      setToast(kind === "avatar" ? t("profile.avatarUpdated", "Аватар оновлено ✅") : t("playlists.coverUploaded", "Обкладинку оновлено ✅"));
    } finally {
      setBusy(false);
    }
  }

  async function saveArtist() {
    const payload = {
      name: String(form.name || "").trim(),
      slug: String(form.slug || "").trim() || null,
      ownerUserId: String(form.ownerUserId || "").trim() || null,
      avatarUrl: String(form.avatarUrl || "").trim() || null,
      coverUrl: String(form.coverUrl || "").trim() || null,
    };

    if (payload.name.length < 2) {
      setToast(t("admin.artistNameMin", "Ім’я артиста має містити щонайменше 2 символи"));
      return;
    }

    setBusy(true);
    try {
      const res = form.id
        ? await updateAdminArtist(form.id, payload)
        : await createAdminArtist(payload);

      if (!res.ok) {
        setToast(res.error || t("admin.artistSaveFailed", "Не вдалося зберегти артиста"));
        return;
      }

      setToast(form.id ? t("common.saved", "Збережено ✅") : t("admin.artistCreated", "Артиста створено ✅"));
      setModalOpen(false);
      resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    if (!form.id) return;
    setBusy(true);
    try {
      const res = await deleteAdminArtist(form.id);
      if (!res.ok) {
        setToast(res.error || t("admin.artistDeleteFailed", "Не вдалося видалити артиста"));
        return;
      }
      setToast(t("common.deleted", "Видалено ✅"));
      setDeleteOpen(false);
      setModalOpen(false);
      resetForm();
      await load();
    } finally {
      setBusy(false);
    }
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="admin-card">
      <div className="admin-card__head">
        <div>
          <div className="admin-title">{t("admin.artists", "Артисти")}</div>
          <div className="admin-subtitle">{t("admin.artistsSub", "Створення, редагування та прив’язка артистів")}</div>
        </div>

        <div className="admin-toolbar">
          <input
            className="admin-input"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t("admin.searchArtist", "Пошук артиста…")}
          />
          <button className="admin-btn" onClick={startCreate} disabled={busy} type="button">
            {t("admin.newArtist", "+ Новий артист")}
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-table__idWide">ID</th>
              <th>{t("common.name", "Ім’я")}</th>
              <th>{t("common.slug", "Slug")}</th>
              <th>{t("common.owner", "Owner")}</th>
              <th>{t("common.cover", "Обкладинка")}</th>
              <th>{t("common.stats", "Статистика")}</th>
              <th>{t("common.actions", "Дії")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((artist) => (
              <tr key={artist.id}>
                <td className="admin-table__muted">{artist.id}</td>
                <td>
                  <div className="admin-table__nameStrong admin-inlineStack">
                    <ArtistAvatar src={artist.avatarUrl} name={artist.name} className="admin-avatar admin-avatar--xs" />
                    <span>{artist.name}</span>
                  </div>
                </td>
                <td className="admin-table__muted">{artist.slug || "—"}</td>
                <td className="admin-table__muted">{artist.ownerUserId || "—"}</td>
                <td>
                  <CoverArt src={artist.coverUrl} title={artist.name} className="admin-cover admin-cover--xs" />
                </td>
                <td className="admin-table__muted">{artist.tracksCount} / {artist.followersCount}</td>
                <td>
                  <div className="admin-actionsRow">
                    <button className="admin-btn admin-btn--ghost" type="button" onClick={() => startEdit(artist)}>
                      {t("common.edit", "Редагувати")}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={7} className="admin-table__empty">
                  {busy ? t("common.loading", "Завантаження…") : t("admin.noArtists", "Артистів поки немає")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={form.id ? t("common.edit", "Редагувати") : t("admin.newArtistTitle", "Новий артист")}
        onClose={!busy ? () => setModalOpen(false) : undefined}
        closeDisabled={busy}
        contentClassName="modal--lg"
        footer={(
          <>
            {form.id ? (
              <button className="admin-btn admin-btn--danger" onClick={() => setDeleteOpen(true)} disabled={busy} type="button">
                {t("common.delete", "Видалити")}
              </button>
            ) : <span />}
            <div className="admin-actionsRow">
              <button className="admin-btn admin-btn--ghost" onClick={() => setModalOpen(false)} disabled={busy} type="button">
                {t("common.cancel", "Скасувати")}
              </button>
              <button className="admin-btn" onClick={saveArtist} disabled={busy} type="button">
                {form.id ? t("common.save", "Зберегти") : t("common.create", "Створити")}
              </button>
            </div>
          </>
        )}
      >
        <div className="admin-grid admin-grid--twoCol">
          <div className="admin-field">
            <div className="admin-label">{t("admin.artistName", "Ім’я артиста")}</div>
            <input className="admin-input" value={form.name} onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))} placeholder={t("common.exampleArtistName", "Наприклад, ім’я артиста")} />
          </div>

          <div className="admin-field">
            <div className="admin-label">{t("common.slug", "Slug")}</div>
            <input className="admin-input" value={form.slug} onChange={(e) => setForm((prev) => ({ ...prev, slug: e.target.value }))} placeholder="neon-waves" />
          </div>

          <div className="admin-field admin-field--full">
            <div className="admin-label">OwnerUserId</div>
            <input className="admin-input" value={form.ownerUserId} onChange={(e) => setForm((prev) => ({ ...prev, ownerUserId: e.target.value }))} placeholder={t("admin.ownerUserIdHint", "ID користувача для прив’язки артиста")} />
          </div>

          <div className="admin-field admin-field--full">
            <div className="admin-label">Avatar</div>
            <div className="admin-uploadRow">
              <ArtistAvatar src={form.avatarUrl} name={form.name || "Artist"} className="admin-avatar admin-avatar--lg" />
              <div className="admin-actionsRow admin-actionsRow--wrap">
                <label className="admin-btn" htmlFor="admin-artist-avatar-upload">{t("profile.uploadAvatar", "Завантажити аватар")}</label>
                <input id="admin-artist-avatar-upload" className="admin-file__input" type="file" accept={IMAGE_ACCEPT} onChange={(e) => uploadImage("avatar", e.target.files?.[0] || null)} />
                <button className="admin-btn admin-btn--ghost" type="button" onClick={() => setForm((prev) => ({ ...prev, avatarUrl: "" }))}>{t("common.clear", "Очистити")}</button>
              </div>
            </div>
          </div>

          <div className="admin-field admin-field--full">
            <div className="admin-label">Cover</div>
            <div className="admin-uploadRow">
              <CoverArt src={form.coverUrl} title={form.name || "Artist"} className="admin-cover admin-cover--lg" />
              <div className="admin-actionsRow admin-actionsRow--wrap">
                <label className="admin-btn" htmlFor="admin-artist-cover-upload">{t("common.changeCover", "Змінити обкладинку")}</label>
                <input id="admin-artist-cover-upload" className="admin-file__input" type="file" accept={IMAGE_ACCEPT} onChange={(e) => uploadImage("cover", e.target.files?.[0] || null)} />
                <button className="admin-btn admin-btn--ghost" type="button" onClick={() => setForm((prev) => ({ ...prev, coverUrl: "" }))}>{t("common.clear", "Очистити")}</button>
              </div>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={deleteOpen}
        title={t("common.delete", "Видалити")}
        onClose={!busy ? () => setDeleteOpen(false) : undefined}
        closeDisabled={busy}
        footer={(
          <>
            <button className="admin-btn admin-btn--ghost" onClick={() => setDeleteOpen(false)} disabled={busy} type="button">
              {t("common.cancel", "Скасувати")}
            </button>
            <button className="admin-btn admin-btn--danger" onClick={confirmDelete} disabled={busy} type="button">
              {t("common.delete", "Видалити")}
            </button>
          </>
        )}
      >
        <div className="admin-field admin-field--stackGap">
          {t("admin.deleteArtistConfirm", "Видалити артиста")}: <b>{form.name || "—"}</b>?
        </div>
      </Modal>

      {!!toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

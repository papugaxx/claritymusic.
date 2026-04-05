

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../components/ui/Modal.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { createAdminGenre, deleteAdminGenre, getAdminGenres, updateAdminGenre } from "../services/adminApi.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function AdminGenres() {
  const { t } = useI18n();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [genres, setGenres] = useState([]);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [toast, setToast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editTarget, setEditTarget] = useState(null);
  const [name, setName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const load = useCallback(async () => {
    setBusy(true);
    try {
      const res = await getAdminGenres();
      if (!res.ok) {
        setGenres([]);
        setToast(res.error || t("admin.genresLoadFailed"));
        return;
      }
      setGenres(Array.isArray(res.data) ? res.data : []);
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
    const timer = setTimeout(() => setToast(""), 2200);
    return () => clearTimeout(timer);
  }, [toast]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const visible = useMemo(() => {
    const terms = String(q || "").trim().toLowerCase();
    if (!terms) return genres;
    return genres.filter((genre) => String(genre?.name || "").toLowerCase().includes(terms) || String(genre?.id ?? "").includes(terms));
  }, [genres, q]);

  
  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function openCreate() {
    setEditTarget(null);
    setName("");
    setModalOpen(true);
  }

  
  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function openEdit(target) {
    setEditTarget(target);
    setName(String(target?.name || ""));
    setModalOpen(true);
  }

  
  async function saveGenre() {
    const trimmed = String(name || "").trim();
    if (!trimmed) return setToast(t("admin.genreNameRequired"));
    if (trimmed.length > 50) return setToast(t("admin.genreNameTooLong"));

    setBusy(true);
    try {
      const isEdit = !!editTarget?.id;
      const res = isEdit
        ? await updateAdminGenre(editTarget.id, trimmed)
        : await createAdminGenre(trimmed);
      if (!res.ok) {
        setToast(res.error || (isEdit ? t("admin.genreSaveFailed") : t("admin.genreCreateFailed")));
        return;
      }
      setToast(isEdit ? t("admin.genreSaved") : t("admin.genreCreated"));
      setModalOpen(false);
      setEditTarget(null);
      setName("");
      await load();
    } finally {
      setBusy(false);
    }
  }

  async function confirmRemove() {
    if (!deleteTarget) return;
    setBusy(true);
    try {
      const res = await deleteAdminGenre(deleteTarget.id);
      if (!res.ok) {
        setToast(res.error || t("admin.genreDeleteFailed"));
        return;
      }
      setDeleteTarget(null);
      setToast(t("admin.genreDeleted"));
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
          <div className="admin-title">{t("admin.genres")}</div>
          <div className="admin-subtitle">{t("admin.genresSub")}</div>
        </div>

        <div className="admin-toolbar">
          <input className="admin-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.searchGenre")} />
          <button className="admin-btn" onClick={openCreate} disabled={busy} type="button">
            {t("admin.newGenre")}
          </button>
        </div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th className="admin-table__idWide">ID</th>
              <th>{t("common.title")}</th>
              <th className="admin-table__actionsCol">{t("common.actions")}</th>
            </tr>
          </thead>
          <tbody>
            {visible.map((genre) => (
              <tr key={genre.id}>
                <td className="admin-table__muted">{genre.id}</td>
                <td className="admin-table__nameStrong">{genre.name}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-iconbtn" title={t("common.edit")} onClick={() => openEdit(genre)} disabled={busy} type="button">✎</button>
                    <button className="admin-iconbtn" title={t("common.delete")} onClick={() => setDeleteTarget(genre)} disabled={busy} type="button">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-table__empty">{busy ? t("common.loading") : t("admin.noGenres")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editTarget ? t("admin.editGenre") : t("admin.newGenreTitle")}
        onClose={!busy ? () => {
          setModalOpen(false);
          setEditTarget(null);
        } : undefined}
        closeDisabled={busy}
        contentClassName="modal--md"
        footer={(
          <>
            <button className="admin-btn admin-btn--ghost" onClick={() => { setModalOpen(false); setEditTarget(null); }} disabled={busy} type="button">
              {t("common.cancel")}
            </button>
            <button className="admin-btn" onClick={saveGenre} disabled={busy} type="button">
              {busy ? t("common.saving") : t("common.save")}
            </button>
          </>
        )}
      >
        <div className="admin-form-grid admin-form-grid--single">
          <div className="admin-field">
            <div className="admin-label">{t("admin.genreName")}</div>
            <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("common.exampleElectronic")} maxLength={50} />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        title={t("admin.deleteGenre")}
        onClose={!busy ? () => setDeleteTarget(null) : undefined}
        closeDisabled={busy}
        contentClassName="modal--sm"
        footer={(
          <>
            <button className="admin-btn admin-btn--ghost" onClick={() => setDeleteTarget(null)} disabled={busy} type="button">
              {t("common.cancel")}
            </button>
            <button className="admin-btn" onClick={confirmRemove} disabled={busy} type="button">
              {busy ? t("common.deleting") : t("common.delete")}
            </button>
          </>
        )}
      >
        <div className="admin-confirmText">{t("admin.deleteGenreConfirm")} <b>{deleteTarget?.name}</b>?</div>
      </Modal>

      {!!toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

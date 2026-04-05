

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Modal from "../components/ui/Modal.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { createAdminMood, deleteAdminMood, getAdminMoods, updateAdminMood } from "../services/adminApi.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function AdminMoods() {
  const { t } = useI18n();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [moods, setMoods] = useState([]);
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
      const res = await getAdminMoods();
      if (!res.ok) {
        setMoods([]);
        setToast(res.error || t("admin.moodsLoadFailed"));
        return;
      }
      setMoods(Array.isArray(res.data) ? res.data : []);
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
    if (!terms) return moods;
    return moods.filter((mood) => String(mood?.name || "").toLowerCase().includes(terms) || String(mood?.id ?? "").includes(terms));
  }, [moods, q]);

  
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

  
  async function saveMood() {
    const trimmed = String(name || "").trim();
    if (!trimmed) return setToast(t("admin.moodNameRequired"));
    if (trimmed.length > 50) return setToast(t("admin.moodNameTooLong"));

    setBusy(true);
    try {
      const isEdit = !!editTarget?.id;
      const res = isEdit
        ? await updateAdminMood(editTarget.id, trimmed)
        : await createAdminMood(trimmed);
      if (!res.ok) {
        setToast(res.error || (isEdit ? t("admin.moodSaveFailed") : t("admin.moodCreateFailed")));
        return;
      }
      setToast(isEdit ? t("admin.moodSaved") : t("admin.moodCreated"));
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
      const res = await deleteAdminMood(deleteTarget.id);
      if (!res.ok) {
        setToast(res.error || t("admin.moodDeleteFailed"));
        return;
      }
      setDeleteTarget(null);
      setToast(t("admin.moodDeleted"));
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
          <div className="admin-title">{t("admin.moods")}</div>
          <div className="admin-subtitle">{t("admin.moodsSub")}</div>
        </div>

        <div className="admin-toolbar">
          <input className="admin-input" value={q} onChange={(e) => setQ(e.target.value)} placeholder={t("admin.searchMood")} />
          <button className="admin-btn" onClick={openCreate} disabled={busy} type="button">
            {t("admin.newMood")}
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
            {visible.map((mood) => (
              <tr key={mood.id}>
                <td className="admin-table__muted">{mood.id}</td>
                <td className="admin-table__nameStrong">{mood.name}</td>
                <td>
                  <div className="admin-actions">
                    <button className="admin-iconbtn" title={t("common.edit")} onClick={() => openEdit(mood)} disabled={busy} type="button">✎</button>
                    <button className="admin-iconbtn" title={t("common.delete")} onClick={() => setDeleteTarget(mood)} disabled={busy} type="button">✕</button>
                  </div>
                </td>
              </tr>
            ))}
            {visible.length === 0 && (
              <tr>
                <td colSpan={3} className="admin-table__empty">{busy ? t("common.loading") : t("admin.noMoods")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal
        open={modalOpen}
        title={editTarget ? t("admin.editMood") : t("admin.newMoodTitle")}
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
            <button className="admin-btn" onClick={saveMood} disabled={busy} type="button">
              {busy ? t("common.saving") : t("common.save")}
            </button>
          </>
        )}
      >
        <div className="admin-form-grid admin-form-grid--single">
          <div className="admin-field">
            <div className="admin-label">{t("admin.moodName")}</div>
            <input className="admin-input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("common.exampleChill")} maxLength={50} />
          </div>
        </div>
      </Modal>

      <Modal
        open={!!deleteTarget}
        title={t("admin.deleteMood")}
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
        <div className="admin-confirmText">{t("admin.deleteMoodConfirm")} <b>{deleteTarget?.name}</b>?</div>
      </Modal>

      {!!toast && <div className="admin-toast">{toast}</div>}
    </div>
  );
}

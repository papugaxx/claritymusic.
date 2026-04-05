

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Field } from "../../ui/Field.jsx";
import { Modal } from "../../ui/Modal.jsx";
import styles from "./AdminPage.module.css";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AdminTaxonomyPage({
  title,
  subtitle,
  entityLabel,
  loadItems,
  createItem,
  updateItem,
  deleteItem,
  emptyText,
}) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [draftName, setDraftName] = useState("");

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const refresh = useCallback(async () => {
    setBusy(true);
    const response = await loadItems();
    setBusy(false);
    if (!response?.ok) {
      setItems([]);
      setMessage(response?.error || `Failed to load ${entityLabel.toLowerCase()}s`);
      return;
    }
    setItems(Array.isArray(response.data) ? response.data : []);
    setMessage("");
  }, [loadItems, entityLabel]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const visible = useMemo(() => {
    const normalized = String(query || "").trim().toLowerCase();
    if (!normalized) return items;
    return items.filter((item) => String(item?.name || "").toLowerCase().includes(normalized) || String(item?.id || "").includes(normalized));
  }, [items, query]);

  async function handleSave(event) {
    event?.preventDefault?.();
    const nextName = String(draftName || "").trim();
    if (!nextName) return;
    setBusy(true);
    const response = editTarget?.id ? await updateItem(editTarget.id, nextName) : await createItem(nextName);
    setBusy(false);
    if (!response?.ok) {
      setMessage(response?.error || `Failed to save ${entityLabel.toLowerCase()}`);
      return;
    }
    setEditTarget(null);
    setDraftName("");
    setMessage(editTarget?.id ? `${entityLabel} updated.` : `${entityLabel} created.`);
    refresh();
  }

  async function handleDelete() {
    if (!deleteTarget?.id) return;
    setBusy(true);
    const response = await deleteItem(deleteTarget.id);
    setBusy(false);
    if (!response?.ok) {
      setMessage(response?.error || `Failed to delete ${entityLabel.toLowerCase()}`);
      return;
    }
    setDeleteTarget(null);
    setMessage(`${entityLabel} deleted.`);
    refresh();
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={styles.page}>
      <section className={styles.tableCard}>
        <div className={styles.sectionLead}>
          <div>
            <h1 className={styles.sectionTitle}>{title}</h1>
            <p className={styles.sectionSubtitle}>{subtitle}</p>
          </div>
          <button type="button" className="primaryButton" onClick={() => { setEditTarget(); setDraftName(""); }}>+ New {entityLabel}</button>
        </div>

        <div className={styles.toolbar}>
          <div className={styles.toolbarGrow}>
            <Field value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`Search ${entityLabel.toLowerCase()}…`} />
          </div>
        </div>

        {message ? <div className="inlineMessage">{message}</div> : null}

        <div className={styles.formGrid}>
          {busy && !visible.length ? <div className={styles.empty}>Loading…</div> : null}
          {!busy && !visible.length ? <div className={styles.empty}>{emptyText}</div> : null}
          {visible.map((item) => (
            <div key={item.id} className={styles.entityRow}>
              <div className={styles.entityMeta}>
                <strong>{item.name}</strong>
                <span>ID: {item.id}</span>
              </div>
              <div className={styles.actions}>
                <button type="button" className="ghostButton" onClick={() => { setEditTarget(item); setDraftName(item.name || ""); }}>Edit</button>
                <button type="button" className="ghostButton" onClick={() => setDeleteTarget(item)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <Modal title={editTarget?.id ? `Edit ${entityLabel}` : `New ${entityLabel}`} open={Boolean(editTarget)} onClose={() => { if (!busy) setEditTarget(null); }}>
        <form className={styles.modalBody} onSubmit={handleSave}>
          <Field label={`${entityLabel} name`} value={draftName} onChange={(event) => setDraftName(event.target.value)} placeholder={`Enter ${entityLabel.toLowerCase()} name`} autoFocus />
          <div className="buttonRow buttonRow--end">
            <button type="button" className="ghostButton" onClick={() => setEditTarget(null)} disabled={busy}>Cancel</button>
            <button type="submit" className="primaryButton" disabled={busy || !draftName.trim()}>{busy ? "Saving…" : "Save"}</button>
          </div>
        </form>
      </Modal>

      <Modal title={`Delete ${entityLabel}`} open={Boolean(deleteTarget)} onClose={() => { if (!busy) setDeleteTarget(null); }}>
        <div className={styles.modalBody}>
          <div className={styles.confirmText}>Delete <strong>{deleteTarget?.name}</strong>?</div>
          <div className="buttonRow buttonRow--end">
            <button type="button" className="ghostButton" onClick={() => setDeleteTarget(null)} disabled={busy}>Cancel</button>
            <button type="button" className="primaryButton primaryButton--danger" onClick={handleDelete} disabled={busy}>{busy ? "Deleting…" : "Delete"}</button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

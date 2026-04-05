

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal.jsx";
import { IMAGE_ACCEPT, validateImageFile } from "../../services/uploadValidation.js";
import { apiFetch } from "../../services/api.js";
import { useI18n } from "../../i18n/I18nProvider.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function readUploadUrl(data) {
  if (!data) return "";
  if (typeof data === "string") return data;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    data.avatarUrl ||
    data.url ||
    data.fileUrl ||
    data.path ||
    data.location ||
    data.data?.avatarUrl ||
    data.data?.url ||
    data.data?.fileUrl ||
    data.result?.avatarUrl ||
    data.result?.url ||
    data.result?.fileUrl ||
    ""
  );
}

async function defaultUploadAvatar(avatarFile) {
  if (!avatarFile) return "";

  const fd = new FormData();
  fd.append("file", avatarFile);

  const upload = await apiFetch("/api/uploads/avatar", {
    method: "POST",
    body: fd,
  });

  if (!upload.ok) {
    throw new Error(upload.error || "Upload failed");
  }

  const url = readUploadUrl(upload.data);
  if (!url) {
    throw new Error("Avatar URL was not returned");
  }

  return url;
}

async function defaultSaveProfile({ displayName, avatarUrl }) {
  const save = await apiFetch("/api/me/profile", {
    method: "PUT",
    body: {
      displayName,
      avatarUrl: avatarUrl || null,
    },
  });

  if (!save.ok) {
    throw new Error(save.error || "Save failed");
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    save.data || {
      displayName,
      avatarUrl,
    }
  );
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function EditProfileModal({
  open,
  onClose,
  me,
  onSaved,
  title,
  introText,
  saveLabel,
  cancelLabel,
  uploadLabel,
  avatarHint,
  nameLabel,
  namePlaceholder,
  uploadAvatar = defaultUploadAvatar,
  saveProfile = defaultSaveProfile,
  buildPayload,
  normalizeSavedData,
  nameMaxLength = 80,
}) {
  const { t } = useI18n();
  const resolvedTitle = title ?? t("profile.editTitle");
  const resolvedIntroText = introText ?? t("profile.editIntro");
  const resolvedSaveLabel = saveLabel ?? t("profile.saveChanges");
  const resolvedCancelLabel = cancelLabel ?? t("profile.cancelChanges");
  const resolvedUploadLabel = uploadLabel ?? t("profile.uploadAvatar");
  const resolvedAvatarHint = avatarHint ?? t("profile.avatarHint");
  const resolvedNameLabel = nameLabel ?? t("profile.displayName");
  const resolvedNamePlaceholder = namePlaceholder ?? t("profile.displayNamePlaceholder");

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const initialName = useMemo(
    () =>
      me?.displayName ||
      me?.name ||
      me?.userName ||
      me?.username ||
      (me?.email ? String(me.email).split("@")[0] : ""),
    [me]
  );

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [form, setForm] = useState({ name: "", avatarUrl: "" });
  const [avatarFile, setAvatarFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!open) return;

    const startAvatar = me?.avatarUrl || me?.avatar || "";

    setForm({
      name: initialName,
      avatarUrl: startAvatar,
    });
    setAvatarFile(null);
    setPreviewUrl(startAvatar);
    setSaving(false);
    setError("");
  }, [open, me, initialName]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  async function uploadAvatarIfNeeded() {
    if (!avatarFile) return { url: String(form.avatarUrl || "").trim(), uploaded: false };
    const url = String((await uploadAvatar(avatarFile)) || "").trim();
    return { url, uploaded: true };
  }

  async function handleSubmit(e) {
    e.preventDefault();

    const trimmedName = String(form.name || "").trim();
    if (!trimmedName) {
      setError(t("profile.nameRequired"));
      return;
    }
    if (trimmedName.length > nameMaxLength) {
      setError(t("profile.nameTooLong", { max: nameMaxLength }));
      return;
    }

    setSaving(true);
    setError("");

    let uploadedAvatarUrl = "";

    try {
      const avatarUpload = await uploadAvatarIfNeeded();
      uploadedAvatarUrl = avatarUpload.url;
      const payload = buildPayload
        ? buildPayload({ name: trimmedName, avatarUrl: uploadedAvatarUrl, me, form })
        : { displayName: trimmedName, avatarUrl: uploadedAvatarUrl };

      const saved = await saveProfile(payload);
      const normalized = normalizeSavedData
        ? normalizeSavedData(saved, payload)
        : saved || payload;

      await onSaved?.(normalized);
    } catch (err) {
      setError(err?.message || t("profile.loadError"));
    } finally {
      setSaving(false);
    }
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <Modal
      open={open}
      title={resolvedTitle}
      onClose={!saving ? onClose : undefined}
      closeDisabled={saving}
      contentClassName="sp-profileModal"
      bodyClassName="sp-profileModal__body"
      footerClassName="sp-profileModal__footer"
      footer={
        <div className="sp-profileEditActions">
          <button
            type="button"
            className="sp-btn sp-btn--ghost"
            onClick={onClose}
            disabled={saving}
          >
            {resolvedCancelLabel}
          </button>

          <button
            type="submit"
            form="edit-profile-form"
            className="sp-btn sp-btn--primary"
            disabled={saving}
          >
            {saving ? t("common.loading") : resolvedSaveLabel}
          </button>
        </div>
      }
    >
      <form id="edit-profile-form" className="sp-profileEditForm" onSubmit={handleSubmit}>
        <div className="sp-profileEditIntro">{resolvedIntroText}</div>

        <div className="sp-profileEditGrid">
          <div className="sp-profileEditAvatarCol">
            <div className="sp-profileEditAvatarCard">
              <div className="sp-profileEditAvatarPreview">
                {previewUrl ? (
                  <img src={previewUrl} alt={t("profile.avatarPreview")} />
                ) : (
                  <div className="sp-profileEditAvatarFallback">
                    {(form.name || "U").slice(0, 1).toUpperCase()}
                  </div>
                )}
              </div>

              <div className="sp-profileEditAvatarHint">{resolvedAvatarHint}</div>

              <label className="sp-profileEditUploadBtn">
                <span>{resolvedUploadLabel}</span>
                <input
                  type="file"
                  accept={IMAGE_ACCEPT}
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0] || null;
                    const validationError = file ? validateImageFile(file, { maxBytes: 5_000_000 }) : "";
                    if (validationError) {
                      setError(validationError);
                      e.target.value = "";
                      return;
                    }

                    setError("");
                    setAvatarFile(file);

                    if (previewUrl && previewUrl.startsWith("blob:")) {
                      URL.revokeObjectURL(previewUrl);
                    }

                    if (file) {
                      setPreviewUrl(URL.createObjectURL(file));
                    } else {
                      setPreviewUrl(form.avatarUrl || "");
                    }
                  }}
                />
              </label>
            </div>
          </div>

          <div className="sp-profileEditFields">
            <label className="sp-profileField">
              <span className="sp-profileField__label">{resolvedNameLabel}</span>
              <input
                className="sp-profileField__control"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={resolvedNamePlaceholder}
                maxLength={nameMaxLength}
              />
            </label>
          </div>
        </div>

        {error ? <div className="sp-bannerError sp-profileEditError">⚠ {error}</div> : null}
      </form>
    </Modal>
  );
}

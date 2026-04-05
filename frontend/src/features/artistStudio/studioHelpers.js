

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { uploadFile } from "../../services/api.js";
import { validateAudioFile, validateImageFile } from "../../services/uploadValidation.js";
import { formatSeconds, getMp3DurationSec as readMp3DurationSec } from "../../utils/audio.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function isMp3File(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return name.endsWith(".mp3") || type === "audio/mpeg" || type === "audio/mp3";
}

export async function getMp3DurationSec(file) {
  return readMp3DurationSec(file, { scope: "artistStudio", zeroAsNull: true });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function pickUploadUrl(value, keys = []) {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = pickUploadUrl(item, keys);
      if (found) return found;
    }
    return null;
  }
  if (typeof value !== "object") return null;

  for (const key of keys) {
    const found = pickUploadUrl(value[key], keys);
    if (found) return found;
  }

  for (const nested of [value.data, value.result, value.file, value.payload]) {
    const found = pickUploadUrl(nested, keys);
    if (found) return found;
  }

  return null;
}

export async function uploadMp3TryEndpoints(file) {
  const validationError = validateAudioFile(file, { maxBytes: 25_000_000 });
  if (validationError) return { ok: false, url: null, endpoint: "/api/uploads/audio", error: validationError };
  const res = await uploadFile("/api/uploads/audio", file);
  if (!res.ok) return { ok: false, url: null, endpoint: "/api/uploads/audio", error: res.error || "Upload failed" };

  const url = pickUploadUrl(res.data, ["audioUrl", "url", "fileUrl", "path"]);
  if (!url) return { ok: false, url: null, endpoint: "/api/uploads/audio", error: "audioUrl missing" };
  return { ok: true, url, endpoint: "/api/uploads/audio", error: null };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function isImageFile(file) {
  const name = String(file?.name || "").toLowerCase();
  const type = String(file?.type || "").toLowerCase();
  return [".jpg", ".jpeg", ".png", ".webp"].some((ext) => name.endsWith(ext))
    || type.startsWith("image/");
}

export async function uploadImageTryEndpoints(file, kind = "cover") {
  const validationError = validateImageFile(file, { maxBytes: 5_000_000 });
  const endpoint = kind === "avatar" ? "/api/uploads/avatar" : "/api/uploads/cover";
  if (validationError) return { ok: false, url: null, endpoint, error: validationError };
  const res = await uploadFile(endpoint, file);
  if (!res.ok) return { ok: false, url: null, endpoint, error: res.error || "Upload failed" };

  const url = pickUploadUrl(res.data, [`${kind}Url`, "imageUrl", "url", "fileUrl", "path"]);
  if (!url) return { ok: false, url: null, endpoint, error: "imageUrl missing" };
  return { ok: true, url, endpoint, error: null };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function fmtSec(sec) {
  return formatSeconds(sec);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function formatPlays(value) {
  const n = Number(value || 0);
  if (!n) return "0";
  if (n >= 1000000) return `${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return String(n);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function trackGenreName(track, genres) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    genres.find((g) => Number(g.id) === Number(track.genreId ?? track.genre?.id))?.name ||
    track.genre?.name ||
    "—"
  );
}

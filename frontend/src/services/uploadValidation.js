

// Константа нижче зберігає повторно використане службове значення

export const IMAGE_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";
export const AUDIO_ACCEPT = ".mp3,audio/mpeg";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function megaBytes(bytes) {
  return Math.round((Number(bytes || 0) / 1024 / 1024) * 10) / 10;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function validateImageFile(file, { maxBytes = 8_000_000 } = {}) {
  if (!file) return "Файл не вибрано";

  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const allowed = type === "image/png" || type === "image/jpeg" || type === "image/webp" || name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp");

  if (!allowed) return "Підтримуються лише PNG, JPG, JPEG або WEBP";
  if (Number(file.size || 0) > maxBytes) return `Файл занадто великий (до ${megaBytes(maxBytes)} MB)`;
  return "";
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function validateAudioFile(file, { maxBytes = 25_000_000 } = {}) {
  if (!file) return "Файл не вибрано";

  const type = String(file.type || "").toLowerCase();
  const name = String(file.name || "").toLowerCase();
  const allowed = type === "audio/mpeg" || name.endsWith(".mp3");

  if (!allowed) return "Підтримується лише MP3";
  if (Number(file.size || 0) > maxBytes) return `Файл занадто великий (до ${megaBytes(maxBytes)} MB)`;
  return "";
}

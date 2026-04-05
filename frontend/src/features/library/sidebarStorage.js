

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { toAbs } from "../../services/media.js";
import { readJsonStorage, writeJsonStorage } from "../../utils/storage.js";

const RECENT_PLAYLISTS_KEY = "clarity:library:recentPlaylists";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function toCoverUrl(value) {
  return toAbs(value || "");
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function readRecentIds() {
  const arr = readJsonStorage(RECENT_PLAYLISTS_KEY, []);
  if (!Array.isArray(arr)) return [];
  return arr.filter((x) => x && typeof x.id === "number").slice(0, 50);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function writeRecentIds(list) {
  writeJsonStorage(RECENT_PLAYLISTS_KEY, list.slice(0, 50));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function bumpRecent(id) {
  const list = readRecentIds().filter((x) => x.id !== id);
  list.unshift({ id, t: Date.now() });
  writeRecentIds(list);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function truncateSidebarText(value, max = 24) {
  const str = String(value || "").trim();
  if (str.length <= max) return str;
  return `${str.slice(0, Math.max(0, max - 3)).trimEnd()}...`;
}

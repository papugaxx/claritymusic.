

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { readJsonStorage, removeStorage, writeJsonStorage } from "../utils/storage.js";

const STORAGE_KEY = "clarity:auth:flow";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function readAuthFlow() {
  const value = readJsonStorage(STORAGE_KEY, {});
  return value && typeof value === "object" ? value : {};
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function writeAuthFlow(patch) {
  const current = readAuthFlow();
  writeJsonStorage(STORAGE_KEY, { ...current, ...(patch || {}) });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function clearAuthFlow() {
  removeStorage(STORAGE_KEY);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function rememberAuthEmail(email) {
  writeAuthFlow({ email: String(email || "").trim() });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function readRememberedAuthEmail() {
  return String(readAuthFlow().email || "").trim();
}

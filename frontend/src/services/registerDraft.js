

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { readJsonSessionStorage, removeSessionStorage, writeJsonSessionStorage } from "../utils/storage.js";

const REGISTER_DRAFT_KEY = "clarity.registerDraft";
let registerPasswordMemory = "";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function sanitizeDraft(value) {
  const draft = value && typeof value === "object" ? { ...value } : {};
  delete draft.password;
  return draft;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function readRegisterDraft() {
  return sanitizeDraft(readJsonSessionStorage(REGISTER_DRAFT_KEY, {}));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function writeRegisterDraft(patch) {
  const current = readRegisterDraft();
  writeJsonSessionStorage(REGISTER_DRAFT_KEY, { ...current, ...sanitizeDraft(patch) });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function readRegisterPassword() {
  return registerPasswordMemory;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function writeRegisterPassword(password) {
  registerPasswordMemory = String(password || "");
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function clearRegisterDraft() {
  registerPasswordMemory = "";
  removeSessionStorage(REGISTER_DRAFT_KEY);
}

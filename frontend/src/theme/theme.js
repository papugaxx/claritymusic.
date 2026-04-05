

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { readStorage, writeStorage } from "../utils/storage.js";

const THEME_STORAGE_KEY = "clarity_theme_preset";

export const THEME_PRESETS = {
  violet: {
    id: "violet",
    label: "Default violet",
    preview: "#2a214f",
    previewAlt: "#17122b",
  },
  light: {
    id: "light",
    label: "Light",
    preview: "#f6f0ff",
    previewAlt: "#dcc8ff",
  },
};

const DEFAULT_THEME_ID = "violet";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function isValidThemeId(value) {
  return Object.prototype.hasOwnProperty.call(THEME_PRESETS, value);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeThemeId(value) {
  return isValidThemeId(value) ? value : DEFAULT_THEME_ID;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function applyTheme(themeId) {
  const normalized = normalizeThemeId(themeId);
  const root = document.documentElement;
  const body = document.body;

  root.dataset.themePreset = normalized;
  root.style.colorScheme = normalized === "light" ? "light" : "dark";

  if (body) {
    body.dataset.themePreset = normalized;
  }

  return normalized;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function saveTheme(themeId) {
  const normalized = normalizeThemeId(themeId);
  writeStorage(THEME_STORAGE_KEY, normalized);
  return normalized;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function loadTheme() {
  const stored = readStorage(THEME_STORAGE_KEY, DEFAULT_THEME_ID);
  return normalizeThemeId(stored);
}

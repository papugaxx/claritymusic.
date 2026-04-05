

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage.js";

const ShellContext = createContext(null);

const THEME_KEY = "clarity:v2:theme";
const LANGUAGE_KEY = "clarity:v2:language";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function ShellProvider({ children }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [searchQuery, setSearchQuery] = useState("");
  const [moodFilter, setMoodFilter] = useState("all");
  const [genreFilter, setGenreFilter] = useState("all");
  const [rightPanelOpen, setRightPanelOpen] = useState(false);
  const [themePreset, setThemePresetState] = useState(() => readStorage(THEME_KEY, "dark") || "dark");
  const [language, setLanguageState] = useState(() => readStorage(LANGUAGE_KEY, "en") || "en");

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const setThemePreset = useCallback((value) => {
    const nextValue = value === "light" ? "light" : "dark";
    setThemePresetState(nextValue);
    writeStorage(THEME_KEY, nextValue);
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const setLanguage = useCallback((value) => {
    const nextValue = ["uk", "ru", "en"].includes(value) ? value : "en";
    setLanguageState(nextValue);
    writeStorage(LANGUAGE_KEY, nextValue);
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleRightPanel = useCallback(() => {
    setRightPanelOpen((value) => !value);
  }, []);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.dataset.appTheme = themePreset;
    document.documentElement.style.colorScheme = themePreset === "light" ? "light" : "dark";
    if (document.body) {
      document.body.dataset.appTheme = themePreset;
      document.body.style.colorScheme = themePreset === "light" ? "light" : "dark";
    }
  }, [themePreset]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = language;
  }, [language]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const value = useMemo(() => ({
    searchQuery,
    setSearchQuery,
    moodFilter,
    setMoodFilter,
    genreFilter,
    setGenreFilter,
    rightPanelOpen,
    setRightPanelOpen,
    toggleRightPanel,
    themePreset,
    setThemePreset,
    language,
    setLanguage,
  }), [searchQuery, moodFilter, genreFilter, rightPanelOpen, toggleRightPanel, themePreset, setThemePreset, language, setLanguage]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <ShellContext.Provider value={value}>{children}</ShellContext.Provider>;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useShell() {
  const ctx = useContext(ShellContext);
  if (!ctx) throw new Error("useShell must be used inside ShellProvider");
  return ctx;
}

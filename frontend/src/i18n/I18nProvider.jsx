

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { DEFAULT_LOCALE, SUPPORTED_LOCALES, translations } from "./translations";
import { readStorage, writeStorage } from "../utils/storage.js";

const STORAGE_KEY = "clarity_language";


// Функція нижче інкапсулює окрему частину логіки цього модуля
function loadLocale() {
  const saved = readStorage(STORAGE_KEY, DEFAULT_LOCALE);
  if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  return DEFAULT_LOCALE;
}

const I18nContext = createContext({
  locale: DEFAULT_LOCALE,
  setLocale: () => {},
  t: (key) => key,
});


// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function I18nProvider({ children }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [locale, setLocale] = useState(loadLocale);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    writeStorage(STORAGE_KEY, locale);
    document.documentElement.lang = locale;
    document.documentElement.dataset.locale = locale;
  }, [locale]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const value = useMemo(() => ({
    locale,
    setLocale,
    t: (key, fallbackOrParams, maybeParams) => {
      const fallback = typeof fallbackOrParams === "string" ? fallbackOrParams : undefined;
      const params = typeof fallbackOrParams === "object" && fallbackOrParams !== null ? fallbackOrParams : maybeParams;
      let value = translations[locale]?.[key] ?? translations[DEFAULT_LOCALE]?.[key] ?? fallback ?? key;
      if (params && typeof value === "string") {
        value = value.replace(/\{(\w+)\}/g, (_, name) => String(params?.[name] ?? `{${name}}`));
      }
      return value;
    },
  }), [locale]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useI18n() {
  return useContext(I18nContext);
}

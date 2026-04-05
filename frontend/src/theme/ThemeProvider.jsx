

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { applyTheme, loadTheme, saveTheme, THEME_PRESETS } from "./theme";

const ThemeContext = createContext({
  themeId: "violet",
  setThemeId: () => {},
  presets: THEME_PRESETS,
});

// Функція нижче інкапсулює окрему частину логіки цього модуля
function ThemeProvider({ children }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [themeId, setThemeId] = useState(loadTheme);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    const applied = applyTheme(themeId);
    saveTheme(applied);
  }, [themeId]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const value = useMemo(
    () => ({
      themeId,
      setThemeId,
      presets: THEME_PRESETS,
    }),
    [themeId]
  );

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useTheme() {
  return useContext(ThemeContext);
}

export default ThemeProvider;

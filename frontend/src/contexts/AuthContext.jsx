

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser } from "../services/authApi.js";

const AuthContext = createContext(null);

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AuthProvider({ children }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [me, setMe] = useState({ isAuthenticated: false });
  const [loading, setLoading] = useState(true);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const refreshMe = useCallback(async () => {
    const res = await getCurrentUser();
    const next = res?.ok && res.data?.isAuthenticated ? res.data : { isAuthenticated: false };
    setMe(next);
    return next;
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const login = useCallback(async (email, password) => {
    const res = await loginUser(email, password);
    await refreshMe();
    return res;
  }, [refreshMe]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const logout = useCallback(async () => {
    await logoutUser();
    await refreshMe();
  }, [refreshMe]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    let active = true;
    (async () => {
      setLoading(true);
      await refreshMe();
      if (active) setLoading(false);
    })();
    return () => { active = false; };
  }, [refreshMe]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const value = useMemo(() => ({ me, loading, refreshMe, login, logout }), [me, loading, refreshMe, login, logout]);
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser } from "../services/authApi.js";

const AuthContext = createContext(null);


// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeMe(data) {
  if (!data || typeof data !== "object") return { isAuthenticated: false };
  if (data.isAuthenticated === true) return data;
  return { isAuthenticated: false };
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AuthProvider({ children }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [me, setMe] = useState({ isAuthenticated: false });
  const [loading, setLoading] = useState(true);

  
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const refreshMe = useCallback(async () => {
    const res = await getCurrentUser();

    if (!res.ok) {
      const next = { isAuthenticated: false };
      setMe(next);
      return next;
    }

    const next = normalizeMe(res.data);
    setMe(next);
    return next;
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const login = useCallback(async (email, password) => {
    const res = await loginUser(email, password);

    if (!res.ok) {
      await refreshMe();
      return {
        ok: false,
        error: res.error || "Login failed",
        status: res.status || 0,
        data: res.data || null,
      };
    }

    await refreshMe();
    return { ok: true, data: res.data || null, status: res.status || 200 };
  }, [refreshMe]);

  
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const logout = useCallback(async () => {
    await logoutUser();
    await refreshMe();
  }, [refreshMe]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      await refreshMe();
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const value = useMemo(() => ({ me, loading, refreshMe, login, logout }), [me, loading, refreshMe, login, logout]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside <AuthProvider>");
  }
  return ctx;
}

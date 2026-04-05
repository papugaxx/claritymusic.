

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth.jsx";
import { isAdmin, isArtist } from "../utils/auth.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function LoadingGate() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <div className="page"><div className="panel">Завантаження…</div></div>;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function RequireAuth({ children }) {
  const { me, loading } = useAuth();
  if (loading) return <LoadingGate />;
  if (!me?.isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function RequireGuest({ children }) {
  const { me, loading } = useAuth();
  if (loading) return <LoadingGate />;
  if (me?.isAuthenticated) return <Navigate to="/app" replace />;
  return children;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function RequireArtist({ children }) {
  const { me, loading } = useAuth();
  if (loading) return <LoadingGate />;
  if (!me?.isAuthenticated) return <Navigate to="/login" replace />;
  if (!isArtist(me)) return <Navigate to="/app/me" replace />;
  return children;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function RequireAdmin({ children }) {
  const { me, loading } = useAuth();
  if (loading) return <LoadingGate />;
  if (!me?.isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin(me)) return <Navigate to="/app" replace />;
  return children;
}

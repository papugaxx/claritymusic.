

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { API_BASE, apiGet, apiPost } from "./api.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getCurrentUser() {
  return apiGet("/api/auth/me");
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function loginUser(email, password) {
  return apiPost("/api/auth/login", { email, password });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function logoutUser() {
  return apiPost("/api/auth/logout", {});
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function registerUser({ email, password, isArtist, displayName }) {
  return apiPost("/api/auth/register", { email, password, isArtist, displayName }, { timeoutMs: 60000 });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function forgotPassword(email) {
  return apiPost("/api/auth/forgot-password", { email }, { timeoutMs: 60000 });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function resetPassword({ email, token, newPassword, confirmNewPassword }) {
  return apiPost("/api/auth/reset-password", { email, token, newPassword, confirmNewPassword });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function confirmEmail({ userId, token }) {
  return apiPost("/api/auth/confirm-email", { userId, token });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function resendConfirmation(email) {
  return apiPost("/api/auth/resend-confirmation", { email }, { timeoutMs: 60000 });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function changePassword({ currentPassword, newPassword, confirmNewPassword }) {
  return apiPost("/api/auth/change-password", { currentPassword, newPassword, confirmNewPassword });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function buildGoogleStartUrl(returnUrl = "/app") {
  const safeReturnUrl = String(returnUrl || "/app").startsWith("/") ? String(returnUrl || "/app") : "/app";
  return `${API_BASE}/api/auth/google/start?returnUrl=${encodeURIComponent(safeReturnUrl)}`;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function startGoogleAuth(returnUrl = "/app") {
  if (typeof window === "undefined") return;
  window.location.assign(buildGoogleStartUrl(returnUrl));
}

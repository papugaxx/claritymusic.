

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { API_BASE } from "./api.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function encodeSvg(svg) {
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function escapeXml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function getInitial(value, fallback = "?") {
  const text = String(value ?? "").trim();
  if (!text) return fallback;
  const ch = Array.from(text)[0] || fallback;
  return ch.toUpperCase();
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function toAbs(url) {
  if (!url) return "";

  const raw = String(url).trim();
  if (!raw) return "";

  if (!raw.includes("/") && /^[a-f0-9_-]{8,}\.(png|jpe?g|webp|gif|svg)$/i.test(raw)) {
    return "";
  }

  let normalized = raw
    .replace(/\\/g, "/")
    .replace(/^~\//, "/")
    .replace(/^https?:\/([^/])/i, (match, rest) => `${match.startsWith("https") ? "https" : "http"}://${rest}`);

  if (normalized.startsWith(API_BASE)) {
    return normalized;
  }

  if (/^www\./i.test(normalized)) {
    return `${window?.location?.protocol || "https:"}//${normalized}`;
  }

  if (
    /^[a-z][a-z\d+.-]*:/i.test(normalized) ||
    normalized.startsWith("data:") ||
    normalized.startsWith("blob:")
  ) {
    return normalized;
  }

  if (normalized.startsWith("//")) {
    return `${window?.location?.protocol || "https:"}${normalized}`;
  }

  if (/^(localhost|127(?:\.\d{1,3}){3}|\d{1,3}(?:\.\d{1,3}){3})(?::\d+)?(?:\/|$)/i.test(normalized)) {
    return `${window?.location?.protocol || "http:"}//${normalized.replace(/^\/+/, "")}`;
  }

  if (normalized.startsWith("/")) {
    return `${API_BASE}${normalized}`;
  }

  if (
    normalized.startsWith("api/") ||
    normalized.startsWith("uploads/") ||
    normalized.startsWith("audio/") ||
    normalized.startsWith("images/") ||
    normalized.startsWith("covers/") ||
    normalized.startsWith("avatars/") ||
    normalized.startsWith("files/")
  ) {
    return `${API_BASE}/${normalized.replace(/^\/+/, "")}`;
  }

  return `${API_BASE}/${normalized.replace(/^\/+/, "")}`;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getCoverPlaceholder(label = "Track") {
  const safeLabel = escapeXml(String(label || "Track").slice(0, 32) || "Track");
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1a0d33"/>
          <stop offset="50%" stop-color="#3a2164"/>
          <stop offset="100%" stop-color="#050b18"/>
        </linearGradient>
        <radialGradient id="bloom" cx="34%" cy="20%" r="88%">
          <stop offset="0%" stop-color="rgba(161,119,255,.18)"/>
          <stop offset="48%" stop-color="rgba(161,119,255,.05)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
        <radialGradient id="shade" cx="84%" cy="90%" r="58%">
          <stop offset="0%" stop-color="rgba(0,0,0,.30)"/>
          <stop offset="100%" stop-color="rgba(0,0,0,0)"/>
        </radialGradient>
      </defs>
      <rect width="256" height="256" fill="#0f0b24"/>
      <rect width="256" height="256" fill="url(#bg)"/>
      <rect width="256" height="256" fill="url(#bloom)"/>
      <rect width="256" height="256" fill="url(#shade)"/>
      <circle cx="128" cy="122" r="61" fill="rgba(204,190,255,.10)"/>
      <circle cx="128" cy="122" r="18" fill="rgba(244,242,250,.90)"/>
      <path d="M161 64a60 60 0 0 1 40 59" fill="none" stroke="rgba(255,255,255,.31)" stroke-width="10" stroke-linecap="round"/>
      <text x="128" y="214" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="18" font-weight="800" fill="rgba(245,242,250,.92)">${safeLabel}</text>
    </svg>
  `;
  return encodeSvg(svg);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getAvatarPlaceholder(label = "Artist", shape = "circle") {
  const initial = escapeXml(getInitial(label, "A"));

  if (shape === "square") {
    const svg = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
        <defs>
          <linearGradient id="sq" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#6a39c2"/>
            <stop offset="100%" stop-color="#090b1c"/>
          </linearGradient>
        </defs>
        <rect width="256" height="256" rx="34" fill="url(#sq)"/>
        <text x="128" y="150" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="96" font-weight="800" fill="rgba(255,255,255,.9)">${initial}</text>
      </svg>
    `;
    return encodeSvg(svg);
  }
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
      <defs>
        <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stop-color="#1f1636"/>
          <stop offset="100%" stop-color="#5b2aa8"/>
        </linearGradient>
      </defs>
      <rect width="256" height="256" rx="128" fill="url(#g)"/>
      <circle cx="128" cy="101" r="46" fill="rgba(255,255,255,.16)"/>
      <path d="M52 214c14-39 44-62 76-62s62 23 76 62" fill="rgba(255,255,255,.16)"/>
      <text x="128" y="148" text-anchor="middle" font-family="Inter, Arial, sans-serif" font-size="64" font-weight="800" fill="rgba(255,255,255,.88)">${initial}</text>
    </svg>
  `;
  return encodeSvg(svg);
}

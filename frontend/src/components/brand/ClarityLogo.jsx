

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function readThemePreset() {
  if (typeof document === "undefined") return "violet";
  const staticPage = document.body?.dataset?.staticPage;
  if (staticPage === "landing") return "violet";
  return document.documentElement?.dataset?.themePreset || "violet";
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function ClarityLogo({ height = 26, compact = false, markOnly = false, phoneCompact = false, className = "" }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [themePreset, setThemePreset] = useState(() => readThemePreset());

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    const root = document.documentElement;
    const body = document.body;
    const syncThemePreset = () => setThemePreset((prev) => {
      const next = readThemePreset();
      return prev === next ? prev : next;
    });

    const observer = new MutationObserver(syncThemePreset);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme-preset"] });
    if (body) {
      observer.observe(body, { attributes: true, attributeFilter: ["data-static-page", "data-theme-preset"] });
    }

    return () => observer.disconnect();
  }, []);

  const h = Number(height) || 26;
  const w = Math.round(h * (compact ? 3.9 : 4.05));

  const wordColor = themePreset === "light" ? "#4A2E83" : "#F3EFFF";
  const musicColor = themePreset === "light" ? "#8E6BFF" : "#C8B6FF";

  if (phoneCompact) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <span
        className={`clarity-logo clarity-logo--base clarity-logo--phoneCompact ${className}`.trim()}
        aria-label="CLARITY.music"
      >
        <span className="clarity-logo__phoneLetter" aria-hidden="true" style={{ color: wordColor }}>C</span>
        <span className="clarity-logo__phoneDot" aria-hidden="true" style={{ color: musicColor }}>.</span>
      </span>
    );
  }

  if (markOnly) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <span
        className={`clarity-logo clarity-logo--base clarity-logo--mark ${className}`.trim()}
        aria-label="CLARITY.music"
      >
        <svg
          width={h}
          height={h}
          viewBox="0 0 40 40"
          role="img"
          aria-hidden="true"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="clarityMarkFill" x1="0" x2="1" y1="0" y2="1">
              <stop offset="0%" stopColor={themePreset === "light" ? "#6B46C1" : "#F3EFFF"} />
              <stop offset="100%" stopColor={themePreset === "light" ? "#A78BFA" : "#C8B6FF"} />
            </linearGradient>
          </defs>
          <rect x="1.5" y="1.5" width="37" height="37" rx="12" fill={themePreset === "light" ? "rgba(255,255,255,0.72)" : "rgba(255,255,255,0.06)"} stroke={themePreset === "light" ? "rgba(74,46,131,0.16)" : "rgba(255,255,255,0.12)"} />
          <path d="M26.4 13.4c-1.6-1.5-3.8-2.4-6.4-2.4-5.1 0-9 3.7-9 9s3.9 9 9 9c2.5 0 4.7-.9 6.3-2.3l-2.1-2.4c-1 .9-2.4 1.4-4 1.4-3.2 0-5.6-2.3-5.6-5.7s2.4-5.7 5.6-5.7c1.7 0 3 .5 4 1.4z" fill="url(#clarityMarkFill)" />
          <circle cx="29.3" cy="12.5" r="2.2" fill={themePreset === "light" ? "#8E6BFF" : "#C8B6FF"} />
        </svg>
      </span>
    );
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <span
      className={`clarity-logo clarity-logo--base ${className}`.trim()}
      aria-label="CLARITY.music"
    >
      <svg
        width={w}
        height={h}
        viewBox="-16 12 320 56"
        role="img"
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        preserveAspectRatio="xMidYMid meet"
      >
        <text
          x="0"
          y="55"
          fontFamily="Inter, Segoe UI, Arial, sans-serif"
          fontSize="40"
          fontWeight="900"
          letterSpacing="-1.8"
          fill={wordColor}
        >
          CLARITY
        </text>
        <text
          x="157"
          y="55"
          fontFamily="Inter, Segoe UI, Arial, sans-serif"
          fontSize="36"
          fontWeight="700"
          letterSpacing="-1.1"
          fill={musicColor}
        >
          .music
        </text>
      </svg>
    </span>
  );
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function MenuDotsIcon() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="5" cy="12" r="1.8" fill="currentColor" />
      <circle cx="12" cy="12" r="1.8" fill="currentColor" />
      <circle cx="19" cy="12" r="1.8" fill="currentColor" />
    </svg>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function PlusIcon() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 5V19M5 12H19"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function SearchIcon() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="currentColor"
        d="M10 4a6 6 0 1 1 0 12A6 6 0 0 1 10 4m0-2a8 8 0 1 0 4.9 14.3l4.4 4.4 1.4-1.4-4.4-4.4A8 8 0 0 0 10 2Z"
      />
    </svg>
  );
}

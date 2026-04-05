

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function EyeIcon({ size = 18 }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
    </svg>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function EyeOffIcon({ size = 18 }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M3 3l18 18"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M10.6 10.6A2.5 2.5 0 0 0 13.4 13.4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M6.3 6.9C3.9 8.7 2.5 12 2.5 12s3.5 7 9.5 7c2 0 3.7-.5 5.2-1.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M9.3 5.4A10.1 10.1 0 0 1 12 5c6 0 9.5 7 9.5 7s-1.2 2.4-3.4 4.3"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function GoogleIcon({ size = 18 }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path fill="#EA4335" d="M12 10.2v3.9h5.4c-.2 1.3-1.5 3.9-5.4 3.9-3.2 0-5.9-2.7-5.9-6s2.7-6 5.9-6c1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 2.6 14.6 1.5 12 1.5 6.9 1.5 2.8 5.6 2.8 11.9S6.9 22.3 12 22.3c6.9 0 8.6-4.9 8.6-7.5 0-.5-.1-1-.1-1.4H12Z"/>
      <path fill="#34A853" d="M3.9 7.3l3.2 2.4c.9-2.7 3.4-4.6 6.3-4.6 1.8 0 3 .8 3.7 1.5l2.5-2.4C16.7 2.6 14.6 1.5 12 1.5c-3.5 0-6.5 2-8.1 5.8Z"/>
      <path fill="#FBBC05" d="M12 22.3c2.5 0 4.6-.8 6.2-2.2l-2.9-2.4c-.8.6-1.9 1.1-3.3 1.1-2.9 0-5.3-1.9-6.2-4.6l-3.2 2.5c1.6 3.8 4.6 5.6 8.6 5.6Z"/>
      <path fill="#4285F4" d="M20.5 11.3c0-.5-.1-1-.1-1.4H12v3.9h5.4c-.3 1.5-1.2 2.7-2.4 3.5l2.9 2.4c1.7-1.6 2.6-3.9 2.6-6.4Z"/>
    </svg>
  );
}

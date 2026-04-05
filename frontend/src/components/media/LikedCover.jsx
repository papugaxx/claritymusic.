

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function LikedCover({ className = "" }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={["liked-cover", className].filter(Boolean).join(" ")} aria-hidden="true">
      <svg viewBox="0 0 24 24" className="liked-cover__icon" focusable="false">
        <path d="M12 20.7 10.55 19.38C5.4 14.72 2 11.65 2 7.88 2 4.81 4.42 2.5 7.4 2.5c1.69 0 3.31.79 4.35 2.04A5.7 5.7 0 0 1 16.1 2.5C19.08 2.5 21.5 4.81 21.5 7.88c0 3.77-3.4 6.84-8.55 11.5L12 20.7Z" fill="currentColor"/>
      </svg>
    </div>
  );
}

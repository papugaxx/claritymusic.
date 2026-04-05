

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function Chip({ active = false, children, onClick, className = "" }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <button type="button" className={`chip ${active ? "is-active" : ""} ${className}`.trim()} onClick={onClick}>{children}</button>;
}

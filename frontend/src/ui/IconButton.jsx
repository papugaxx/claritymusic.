

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function IconButton({ children, className = "", ...props }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <button type="button" className={`iconButton ${className}`.trim()} {...props}>{children}</button>;
}

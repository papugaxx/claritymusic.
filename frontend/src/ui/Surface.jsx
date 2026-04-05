

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function Surface({ as: Tag = "section", className = "", children, ...props }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <Tag className={`surface ${className}`.trim()} {...props}>{children}</Tag>;
}

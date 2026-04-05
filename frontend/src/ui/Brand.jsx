

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function Brand({ large = false }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <div className={large ? "brand brand--large" : "brand"}><span>CLARITY</span><em>.music</em></div>;
}

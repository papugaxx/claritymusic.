

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function Field({ label, type = "text", className = "", inputClassName = "", ...props }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <label className={`field ${className}`.trim()}>
      {label ? <span className="field__label">{label}</span> : null}
      <input className={`field__input ${inputClassName}`.trim()} type={type} {...props} />
    </label>
  );
}

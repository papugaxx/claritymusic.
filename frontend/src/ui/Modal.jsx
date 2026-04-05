

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect } from "react";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function Modal({ title, open, onClose, children }) {
  // Ефект дозволяє закривати активний елемент через клавішу Escape
  useEffect(() => {
    if (!open) return undefined;
    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onKeyDown(event) {
      if (event.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="modalBackdrop" onClick={onClose}>
      <div className="modalCard" onClick={(event) => event.stopPropagation()}>
        <div className="modalCard__header">
          <h3>{title}</h3>
          <button type="button" className="iconButton iconButton--bare modalCard__close" onClick={onClose} aria-label="Close modal">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

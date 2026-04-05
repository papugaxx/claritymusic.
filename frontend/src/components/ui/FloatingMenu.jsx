

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useOutsideClose(open, rootRef, onClose) {
  // Ефект підписує компонент на зовнішні події і знімає підписку під час очищення
  useEffect(() => {
    if (!open) return undefined;

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onDown(event) {
      const el = rootRef?.current;
      if (!el) return;
      const target = event.target;
      if (target && target.closest && target.closest("[data-ui-dd-root]")) return;
      if (!el.contains(target)) onClose?.();
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, rootRef, onClose]);
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useFloatingStyle(
  open,
  anchorRef,
  { minWidth = 0, widthMode = "anchor", align = "left", gap = 8, maxWidth } = {},
) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [style, setStyle] = useState(null);

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    if (!open) return undefined;

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function update() {
      const el = anchorRef?.current;
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const vw = window.innerWidth || 0;
      const vh = window.innerHeight || 0;
      const resolvedWidth = widthMode === "anchor" ? rect.width : Math.max(minWidth, rect.width);
      const limitedWidth = Math.min(
        Math.max(minWidth, resolvedWidth),
        maxWidth || resolvedWidth,
        Math.max(260, vw - 24),
      );
      const left = align === "right"
        ? Math.max(12, Math.min(rect.right - limitedWidth, vw - limitedWidth - 12))
        : Math.max(12, Math.min(rect.left, vw - limitedWidth - 12));

      setStyle({
        position: "fixed",
        top: Math.min(rect.bottom + gap, vh - 12),
        left,
        width: limitedWidth,
        maxWidth: "calc(100vw - 24px)",
        maxHeight: `min(70vh, calc(100vh - ${Math.round(rect.bottom + gap + 12)}px))`,
      });
    }

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);

    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, anchorRef, minWidth, widthMode, align, gap, maxWidth]);

  return style;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function FloatingMenu({ open, align = "left", className = "", children, style = null, portal = false, ...props }) {
  if (!open) return null;

  const cls = ["ui-dd", `ui-dd--${align}`, className, portal ? "ui-dd--floating" : ""].filter(Boolean).join(" ");
  const node = <div className={cls} style={style} data-ui-dd-root {...props}>{children}</div>;

  return portal ? createPortal(node, document.body) : node;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function FloatingMenuItem({ active = false, danger = false, onClick, children }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <button
      type="button"
      className={`ui-dd__item${active ? " is-active" : ""}${danger ? " is-danger" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function FloatingMenuSeparator() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <div className="ui-dd__sep" role="separator" />;
}

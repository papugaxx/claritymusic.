

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useLayerDismiss(open, refs, onClose) {
  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (!open) return undefined;
    const list = Array.isArray(refs) ? refs : [refs];

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handlePointerDown(event) {
      const inside = list.some((ref) => ref?.current?.contains?.(event.target));
      if (!inside) onClose?.();
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handleEscape(event) {
      if (event.key === "Escape") onClose?.();
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open, refs, onClose]);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePopoverStyle(open, anchorRef, {
  align = "left",
  side = "bottom",
  offset = 8,
  minWidth = 180,
  maxWidth = 320,
  matchWidth = false,
  width = null,
  estimatedHeight = 220,
} = {}) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [style, setStyle] = useState(null);
  const menuRef = useRef(null);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const update = useCallback(() => {
    const anchor = anchorRef?.current;
    if (!anchor) return;

    const rect = anchor.getBoundingClientRect();
    const vw = window.innerWidth || 0;
    const vh = window.innerHeight || 0;
    const measuredHeight = Math.max(menuRef.current?.offsetHeight || 0, estimatedHeight);
    const resolvedWidth = clamp(
      width ?? (matchWidth ? rect.width : Math.max(minWidth, Math.min(maxWidth, rect.width))),
      minWidth,
      Math.min(maxWidth, vw - 24),
    );

    const belowSpace = vh - rect.bottom - offset - 12;
    const aboveSpace = rect.top - offset - 12;
    const openUp = side === "top" || (side === "auto" && belowSpace < Math.min(180, measuredHeight) && aboveSpace > belowSpace);

    let left = align === "right" ? rect.right - resolvedWidth : rect.left;
    left = clamp(left, 12, vw - resolvedWidth - 12);

    const styleValue = {
      position: "fixed",
      left,
      width: resolvedWidth,
      maxWidth: `calc(100vw - 24px)`,
      zIndex: 90,
      maxHeight: openUp ? Math.max(120, aboveSpace) : Math.max(120, belowSpace),
      overflow: "auto",
      transform: openUp ? "translateY(-100%)" : "none",
      top: openUp ? rect.top - offset : rect.bottom + offset,
    };

    setStyle(styleValue);
  }, [anchorRef, align, estimatedHeight, matchWidth, maxWidth, minWidth, offset, side, width]);

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    if (!open) return undefined;
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, update]);

  return { style, menuRef, update };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function MenuPopover({ open, children, className = "", style, menuRef }) {
  if (!open || !style) return null;
  return createPortal(
    <div ref={menuRef} className={["menuPopover", className].filter(Boolean).join(" ")} style={style}>
      {children}
    </div>,
    document.body,
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function MenuItem({ danger = false, onClick, children, type = "button" }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <button type={type} className={`menuPopover__item ${danger ? "menuPopover__item--danger" : ""}`.trim()} onClick={onClick}>
      {children}
    </button>
  );
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function MenuSeparator() {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <div className="menuPopover__separator" role="separator" />;
}

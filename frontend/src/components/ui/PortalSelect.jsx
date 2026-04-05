

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../i18n/I18nProvider.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function PortalSelectItem({ active, onClick, children }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <button
      type="button"
      className={`ui-dd__item${active ? " is-active" : ""}`}
      onClick={onClick}
      role="menuitem"
    >
      {children}
    </button>
  );
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function PortalSelect({
  value,
  onChange,
  options,
  placeholder,
  align = "left",
  rootClassName = "",
  buttonClassName = "ui-select",
  menuClassName = "adminPortalMenu",
  minWidth = 180,
  maxMenuWidth = 320,
  zIndex = 10020,
}) {
  const { t } = useI18n();
  const selectPlaceholder = placeholder ?? t("common.choose");
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const current = useMemo(() => options.find((o) => String(o.value) === String(value)), [options, value]);
  const label = current?.label ?? (value ? String(value) : selectPlaceholder);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const gap = 8;
    const edge = 12;
    const rect = btnRef.current.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const menuWidth = Math.max(minWidth, Math.min(rect.width || minWidth, maxMenuWidth, viewportWidth - edge * 2));
    const preferredLeft = align === "right" ? rect.right - menuWidth : rect.left;
    const left = Math.max(edge, Math.min(preferredLeft, viewportWidth - menuWidth - edge));
    const spaceBelow = viewportHeight - rect.bottom - edge;
    const spaceAbove = rect.top - edge;
    const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
    const maxHeight = Math.max(140, Math.min(320, (openUp ? spaceAbove : spaceBelow) - gap));

    setPos({
      left,
      width: menuWidth,
      top: openUp ? undefined : rect.bottom + gap,
      bottom: openUp ? viewportHeight - rect.top + gap : undefined,
      maxHeight,
    });
  }, [align, maxMenuWidth, minWidth]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!open) return;

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onDown(event) {
      const root = rootRef.current;
      const menu = menuRef.current;
      const target = event.target;
      if (!target) return;
      if (root?.contains(target) || menu?.contains(target)) return;
      setOpen(false);
    }

    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    if (!open) return;
    updatePosition();

    const sync = () => updatePosition();
    window.addEventListener("resize", sync);
    window.addEventListener("scroll", sync, true);

    return () => {
      window.removeEventListener("resize", sync);
      window.removeEventListener("scroll", sync, true);
    };
  }, [open, updatePosition]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div ref={rootRef} className={rootClassName}>
      <button
        ref={btnRef}
        type="button"
        className={buttonClassName}
        onClick={() => {
          updatePosition();
          setOpen((v) => !v);
        }}
        aria-haspopup="menu"
        aria-expanded={open ? "true" : "false"}
      >
        <span className="ui-select__text">{label}</span>
        <span className="ui-select__caret">▾</span>
      </button>

      {open && pos
        ? createPortal(
            <div
              ref={menuRef}
              className={`ui-dd ui-dd--${align} ${menuClassName}`.trim()}
              role="menu"
              style={{
                position: "fixed",
                top: pos.top ?? "auto",
                bottom: pos.bottom ?? "auto",
                left: pos.left,
                width: pos.width,
                maxHeight: pos.maxHeight,
                zIndex,
                overflow: "auto",
              }}
            >
              {options.map((option) => (
                <PortalSelectItem
                  key={String(option.value)}
                  active={String(option.value) === String(value)}
                  onClick={() => {
                    setOpen(false);
                    onChange?.(option.value);
                  }}
                >
                  {option.label}
                </PortalSelectItem>
              ))}
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}

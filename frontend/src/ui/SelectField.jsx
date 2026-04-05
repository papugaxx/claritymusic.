

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function getMenuPosition(triggerRect, width, estimatedHeight = 220) {
  const gap = 8;
  const edge = 12;
  const viewportWidth = window.innerWidth || 0;
  const viewportHeight = window.innerHeight || 0;
  const menuWidth = Math.max(Number(width) || 0, triggerRect.width || 220, 220);
  const safeWidth = Math.min(menuWidth, viewportWidth - edge * 2);
  const preferredHeight = clamp(estimatedHeight || 220, 160, 360);
  const spaceBelow = viewportHeight - triggerRect.bottom - gap - edge;
  const spaceAbove = triggerRect.top - gap - edge;
  const openUp = spaceBelow < preferredHeight && spaceAbove > spaceBelow;

  let left = triggerRect.left;
  left = clamp(left, edge, viewportWidth - safeWidth - edge);

  return {
    position: "fixed",
    left,
    width: safeWidth,
    maxWidth: `calc(100vw - ${edge * 2}px)`,
    top: openUp ? "auto" : triggerRect.bottom + gap,
    bottom: openUp ? viewportHeight - triggerRect.top + gap : "auto",
    maxHeight: Math.max(120, openUp ? spaceAbove : spaceBelow),
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function SelectField({
  label = "",
  value,
  onChange,
  options = [],
  className = "",
  disabled = false,
  placeholder = "Select",
  width = null,
}) {
  const listboxId = useId();
  const rootRef = useRef(null);
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const optionRefs = useRef([]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const safeOptions = useMemo(() => Array.isArray(options) ? options : [], [options]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const selectedIndex = useMemo(
    () => safeOptions.findIndex((option) => String(option.value) === String(value)),
    [safeOptions, value],
  );
  const selectedOption = selectedIndex >= 0 ? safeOptions[selectedIndex] : null;
  const buttonLabel = selectedOption?.label || placeholder || "Select";

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [open, setOpen] = useState(false);
  const [menuStyle, setMenuStyle] = useState(null);
  const [activeIndex, setActiveIndex] = useState(selectedIndex >= 0 ? selectedIndex : 0);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const placeMenu = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const estimatedHeight = menuRef.current?.offsetHeight || Math.min(320, safeOptions.length * 46 + 16);
    setMenuStyle(getMenuPosition(rect, width, estimatedHeight));
  }, [safeOptions.length, width]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const focusOption = useCallback((index) => {
    requestAnimationFrame(() => optionRefs.current[index]?.focus?.());
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const closeMenu = useCallback(() => {
    setOpen(false);
    setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
    triggerRef.current?.focus?.();
  }, [selectedIndex]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const commit = useCallback((nextValue) => {
    onChange?.(nextValue);
    setOpen(false);
    triggerRef.current?.focus?.();
  }, [onChange]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (open) {
      setActiveIndex(selectedIndex >= 0 ? selectedIndex : 0);
      placeMenu();
    }
  }, [open, selectedIndex, placeMenu]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!open) return undefined;

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handlePointerDown(event) {
      if (menuRef.current?.contains(event.target)) return;
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handleViewportChange() {
      placeMenu();
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handleEscape(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);
    window.addEventListener("resize", handleViewportChange);
    window.addEventListener("scroll", handleViewportChange, true);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
      window.removeEventListener("resize", handleViewportChange);
      window.removeEventListener("scroll", handleViewportChange, true);
    };
  }, [open, placeMenu, closeMenu]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function handleTriggerKeyDown(event) {
    if (disabled || !safeOptions.length) return;

    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) setOpen(true);
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function handleOptionKeyDown(event, index, optionValue) {
    if (event.key === "Escape") {
      event.preventDefault();
      closeMenu();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      commit(optionValue);
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      const nextIndex = clamp(index + 1, 0, safeOptions.length - 1);
      setActiveIndex(nextIndex);
      focusOption(nextIndex);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = clamp(index - 1, 0, safeOptions.length - 1);
      setActiveIndex(nextIndex);
      focusOption(nextIndex);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setActiveIndex(0);
      focusOption(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      const nextIndex = Math.max(0, safeOptions.length - 1);
      setActiveIndex(nextIndex);
      focusOption(nextIndex);
    }
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <label className={`selectField ${className}`.trim()} ref={rootRef}>
      {label ? <span className="selectField__label">{label}</span> : null}
      <span className="selectField__wrap" style={width ? { width } : undefined}>
        <button
          type="button"
          className={`selectField__trigger ${open ? "is-open" : ""}`.trim()}
          onClick={() => {
            if (disabled || !safeOptions.length) return;
            setOpen((current) => !current);
          }}
          onKeyDown={handleTriggerKeyDown}
          aria-haspopup="listbox"
          aria-controls={open ? listboxId : undefined}
          aria-expanded={open}
          disabled={disabled}
          ref={triggerRef}
        >
          <span className={`selectField__value ${selectedOption ? "is-filled" : ""}`.trim()}>{buttonLabel}</span>
          <span className="selectField__caret">▾</span>
        </button>
      </span>

      {open && menuStyle ? createPortal(
        <div
          id={listboxId}
          ref={menuRef}
          className="selectField__menu surface"
          role="listbox"
          aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
          style={menuStyle}
        >
          {safeOptions.map((option, index) => {
            const selected = String(option.value) === String(value);
            // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
            return (
              <button
                key={String(option.value)}
                id={`${listboxId}-option-${index}`}
                type="button"
                ref={(node) => {
                  optionRefs.current[index] = node;
                }}
                role="option"
                aria-selected={selected}
                tabIndex={activeIndex === index ? 0 : -1}
                className={`selectField__option ${selected ? "is-selected" : ""} ${activeIndex === index ? "is-active" : ""}`.trim()}
                onClick={() => commit(option.value)}
                onMouseEnter={() => setActiveIndex(index)}
                onKeyDown={(event) => handleOptionKeyDown(event, index, option.value)}
              >
                {option.label}
              </button>
            );
          })}
        </div>,
        document.body,
      ) : null}
    </label>
  );
}

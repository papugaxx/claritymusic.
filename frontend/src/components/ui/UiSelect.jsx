

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../i18n/I18nProvider.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function getMenuPosition(triggerRect, width, align) {
  const gap = 8;
  const edge = 12;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;
  const numericWidth = typeof width === "number" && Number.isFinite(width) ? width : null;
  const menuWidth = Math.max(200, numericWidth || triggerRect.width || 200);

  const preferredLeft = align === "left" ? triggerRect.left : triggerRect.right - menuWidth;
  const left = Math.max(edge, Math.min(preferredLeft, viewportWidth - menuWidth - edge));
  const spaceBelow = viewportHeight - triggerRect.bottom - edge;
  const spaceAbove = triggerRect.top - edge;
  const openUp = spaceBelow < 220 && spaceAbove > spaceBelow;
  const maxHeight = Math.max(140, Math.min(320, (openUp ? spaceAbove : spaceBelow) - gap));

  return {
    left,
    width: menuWidth,
    top: openUp ? undefined : triggerRect.bottom + gap,
    bottom: openUp ? viewportHeight - triggerRect.top + gap : undefined,
    maxHeight,
  };
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function UiSelect({
  value,
  onChange,
  options,
  placeholder,
  width = 180,
  align = "right",
  disabled = false,
  portal = true,
}) {
  const rootRef = useRef(null);
  const btnRef = useRef(null);
  const dropdownRef = useRef(null);
  const optionRefs = useRef([]);
  const listboxId = useId();

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const safeOptions = useMemo(() => (Array.isArray(options) ? options : []), [options]);
  const { t } = useI18n();
  const selectPlaceholder = placeholder ?? t("common.choose");
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const [activeIndex, setActiveIndex] = useState(-1);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const selectedIndex = useMemo(
    () => safeOptions.findIndex((item) => String(item.value) === String(value)),
    [safeOptions, value],
  );
  const widthCss = typeof width === "number" ? `${width}px` : (typeof width === "string" && width.trim() ? width.trim() : null);
  const rootStyle = widthCss ? { "--ui-select-width": widthCss, width: widthCss } : undefined;

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const selectedLabel = useMemo(() => {
    const found = selectedIndex >= 0 ? safeOptions[selectedIndex] : null;
    return found?.label || selectPlaceholder;
  }, [safeOptions, selectedIndex, selectPlaceholder]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const placeDropdown = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    setPos(getMenuPosition(rect, width, align));
  }, [align, width]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const focusOption = useCallback((index) => {
    requestAnimationFrame(() => {
      optionRefs.current[index]?.focus?.();
    });
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const openMenu = useCallback(() => {
    if (disabled || safeOptions.length === 0) return;
    const nextIndex = selectedIndex >= 0 ? selectedIndex : 0;
    if (portal) placeDropdown();
    setActiveIndex(nextIndex);
    setOpen(true);
    focusOption(nextIndex);
  }, [disabled, focusOption, placeDropdown, portal, safeOptions.length, selectedIndex]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const closeMenu = useCallback(() => {
    setOpen(false);
    btnRef.current?.focus?.();
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const commit = useCallback(
    (nextValue) => {
      onChange?.(nextValue);
      setOpen(false);
      btnRef.current?.focus?.();
    },
    [onChange],
  );

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  React.useEffect(() => {
    if (disabled && open) setOpen(false);
    if (!open) return undefined;

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onDocDown(event) {
      if (dropdownRef.current?.contains(event.target)) return;
      if (rootRef.current?.contains(event.target)) return;
      setOpen(false);
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onViewportChange() {
      placeDropdown();
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onEscape(event) {
      if (event.key === "Escape") {
        event.preventDefault();
        closeMenu();
      }
    }

    document.addEventListener("mousedown", onDocDown);
    document.addEventListener("keydown", onEscape);
    if (portal) {
      window.addEventListener("resize", onViewportChange);
      window.addEventListener("scroll", onViewportChange, true);
    }

    return () => {
      document.removeEventListener("mousedown", onDocDown);
      document.removeEventListener("keydown", onEscape);
      if (portal) {
        window.removeEventListener("resize", onViewportChange);
        window.removeEventListener("scroll", onViewportChange, true);
      }
    };
  }, [closeMenu, disabled, open, placeDropdown, portal]);

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function onTriggerKeyDown(event) {
    if (disabled) return;
    if (["ArrowDown", "ArrowUp", "Enter", " "].includes(event.key)) {
      event.preventDefault();
      if (!open) openMenu();
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    }
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function renderMenu(positioningStyle = {}) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div
        id={listboxId}
        className={`profile-dropdown ui-selectMenu ui-selectMenu--${align}${portal ? "" : " ui-selectMenu--inline"}`}
        ref={dropdownRef}
        role="listbox"
        style={positioningStyle}
        aria-activedescendant={activeIndex >= 0 ? `${listboxId}-option-${activeIndex}` : undefined}
      >
        {safeOptions.map((opt, index) => {
          const isSelected = String(value) === String(opt.value);
          // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
          return (
            <button
              key={String(opt.value)}
              id={`${listboxId}-option-${index}`}
              ref={(node) => {
                optionRefs.current[index] = node;
              }}
              className={`profile-dd-item ui-selectMenu__item${isSelected ? " is-active" : ""}`}
              role="option"
              aria-selected={isSelected}
              type="button"
              tabIndex={activeIndex === index ? 0 : -1}
              onClick={() => commit(opt.value)}
              onKeyDown={(event) => onOptionKeyDown(event, index, opt.value)}
              onMouseEnter={() => setActiveIndex(index)}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    );
  }

  // Функція нижче інкапсулює окрему частину логіки цього модуля
  function onOptionKeyDown(event, index, optionValue) {
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
      const nextIndex = Math.min(safeOptions.length - 1, index + 1);
      setActiveIndex(nextIndex);
      focusOption(nextIndex);
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      const nextIndex = Math.max(0, index - 1);
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
    <div ref={rootRef} className="ui-selectRoot" data-ui-select-root style={rootStyle}>
      <button
        type="button"
        className="sp-select ui-selectTrigger"
        ref={btnRef}
        onClick={() => { if (disabled) return; open ? setOpen(false) : openMenu(); }}
        onKeyDown={onTriggerKeyDown}
        aria-haspopup="listbox"
        aria-controls={open ? listboxId : undefined}
        aria-expanded={open}
        disabled={disabled}
      >
        <span className="ui-selectTrigger__label">{selectedLabel}</span>
      </button>

      {open
        ? portal
          ? pos
            ? createPortal(
                renderMenu({
                  position: "fixed",
                  top: pos.top ?? "auto",
                  bottom: pos.bottom ?? "auto",
                  left: pos.left,
                  width: pos.width,
                  maxHeight: pos.maxHeight,
                  overflow: "auto",
                }),
                document.body,
              )
            : null
          : renderMenu({
              width: `min(var(--ui-select-width, ${width}px), calc(100vw - 24px))`,
              maxHeight: "min(240px, calc(100vh - 160px))",
              overflow: "auto",
            })
        : null}
    </div>
  );
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useId, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../../i18n/I18nProvider.jsx";

const EXIT_MS = 170;
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function Modal({
  open,
  title,
  children,
  onClose,
  footer,
  closeDisabled = false,
  closeLabel,
  overlayClassName = "",
  contentClassName = "",
  bodyClassName = "",
  footerClassName = "",
  titleClassName = "",
  showCloseButton = true,
}) {
  const { t } = useI18n();
  const resolvedCloseLabel = closeLabel ?? t("common.close");
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [mounted, setMounted] = useState(open);
  const [visible, setVisible] = useState(open);
  const panelRef = useRef(null);
  const titleId = useId();
  const restoreFocusRef = useRef(null);
  const didFocusOnOpenRef = useRef(false);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (open) {
      restoreFocusRef.current = typeof document !== "undefined" ? document.activeElement : null;
      didFocusOnOpenRef.current = false;
      setMounted(true);
      const id = window.requestAnimationFrame(() => setVisible(true));
      return () => window.cancelAnimationFrame(id);
    }

    if (!mounted) return undefined;

    setVisible(false);
    didFocusOnOpenRef.current = false;
    const timer = window.setTimeout(() => setMounted(false), EXIT_MS);
    return () => window.clearTimeout(timer);
  }, [open, mounted]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (!mounted) return undefined;

    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mounted]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (!mounted) return undefined;

    const panel = panelRef.current;
    if (!panel) return undefined;

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onKey(event) {
      if (event.key === "Escape" && !closeDisabled) {
        event.preventDefault();
        onClose?.();
        return;
      }

      if (event.key !== "Tab") return;

      const focusableNodes = Array.from(panel.querySelectorAll(FOCUSABLE_SELECTOR)).filter(
        (node) => !node.hasAttribute("disabled") && node.getAttribute("aria-hidden") !== "true"
      );

      if (focusableNodes.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const firstNode = focusableNodes[0];
      const lastNode = focusableNodes[focusableNodes.length - 1];
      const active = document.activeElement;

      if (event.shiftKey) {
        if (active === firstNode || active === panel) {
          event.preventDefault();
          lastNode.focus();
        }
        return;
      }

      if (active === lastNode) {
        event.preventDefault();
        firstNode.focus();
      }
    }

    panel.addEventListener("keydown", onKey);
    return () => panel.removeEventListener("keydown", onKey);
  }, [mounted, closeDisabled, onClose]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (!mounted || !open || didFocusOnOpenRef.current) return undefined;

    const panel = panelRef.current;
    if (!panel) return undefined;

    const rafId = window.requestAnimationFrame(() => {
      const preferred = panel.querySelector(
        '[data-autofocus], input:not([type="hidden"]):not([disabled]), textarea:not([disabled]), select:not([disabled]), [contenteditable="true"]'
      );
      const firstFocusable = panel.querySelector(FOCUSABLE_SELECTOR);
      const fallback = panel;
      (preferred || firstFocusable || fallback)?.focus?.();
      didFocusOnOpenRef.current = true;
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [mounted, open]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (mounted) return undefined;
    const previous = restoreFocusRef.current;
    if (previous && typeof previous.focus === "function") {
      previous.focus();
    }
    restoreFocusRef.current = null;
    return undefined;
  }, [mounted]);

  const state = visible ? "open" : "closed";
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const overlayClasses = useMemo(() => ["modalOverlay", overlayClassName].filter(Boolean).join(" "), [overlayClassName]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const panelClasses = useMemo(() => ["modal", contentClassName].filter(Boolean).join(" "), [contentClassName]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const bodyClasses = useMemo(() => ["modalBody", bodyClassName].filter(Boolean).join(" "), [bodyClassName]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const footerClasses = useMemo(() => ["modalFooter", footerClassName].filter(Boolean).join(" "), [footerClassName]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const titleClasses = useMemo(() => ["modalTitle", titleClassName].filter(Boolean).join(" "), [titleClassName]);

  if (!mounted || typeof document === "undefined") return null;

  return createPortal(
    <div
      className={overlayClasses}
      data-state={state}
      onMouseDown={(event) => {
        if (closeDisabled) return;
        if (event.target === event.currentTarget) onClose?.();
      }}
    >
      <div
        ref={panelRef}
        className={panelClasses}
        data-state={state}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
      >
        {(title || showCloseButton) && (
          <div className="modalHeader">
            <div className={titleClasses} id={title ? titleId : undefined}>{title}</div>
            {showCloseButton ? (
              <button
                className="iconBtn modalCloseBtn"
                type="button"
                aria-label={resolvedCloseLabel}
                onClick={onClose}
                disabled={closeDisabled}
              >
                ✕
              </button>
            ) : null}
          </div>
        )}

        <div className={bodyClasses}>{children}</div>

        {footer ? <div className={footerClasses}>{footer}</div> : null}
      </div>
    </div>,
    document.body
  );
}

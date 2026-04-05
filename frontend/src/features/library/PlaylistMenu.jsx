

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function PlaylistMenu({
  playlist,
  anchorRect,
  onClose,
  onOpen,
  onRename,
  onChangeCover,
  onDelete,
  t,
}) {
  const menuRef = useRef(null);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [position, setPosition] = useState({
    top: 0,
    left: 0,
    transformOrigin: "top right",
  });

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function placeMenu() {
      if (!anchorRect) return;

      const menuWidth = 196;
      const menuHeight = menuRef.current?.offsetHeight || 230;
      const gap = 10;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      let left = anchorRect.right - menuWidth;
      let top = anchorRect.bottom + 8;
      let transformOrigin = "top right";

      if (left < gap) {
        left = gap;
        transformOrigin = "top left";
      }

      if (left + menuWidth > vw - gap) {
        left = vw - menuWidth - gap;
      }

      if (top + menuHeight > vh - gap) {
        top = anchorRect.top - menuHeight - 8;
        transformOrigin = "bottom right";
      }

      if (top < gap) {
        top = gap;
      }

      setPosition({ top, left, transformOrigin });
    }

    placeMenu();
    window.addEventListener("resize", placeMenu);
    window.addEventListener("scroll", placeMenu, true);

    return () => {
      window.removeEventListener("resize", placeMenu);
      window.removeEventListener("scroll", placeMenu, true);
    };
  }, [anchorRect]);

  // Ефект дозволяє закривати активний елемент через клавішу Escape
  useEffect(() => {
    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function onKeyDown(event) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  if (!anchorRect || !playlist) return null;

  return createPortal(
    <>
      <div className="playlistMenuPortalBackdrop" onClick={onClose} />

      <div
        ref={menuRef}
        className="playlistMenu"
        style={{
          top: position.top,
          left: position.left,
          transformOrigin: position.transformOrigin,
        }}
      >
        <div className="playlistMenu__header">
          <div className="playlistMenu__title" title={playlist.name}>
            {playlist.name}
          </div>
          <div className="playlistMenu__subtitle">{t("common.playlistActions")}</div>
        </div>

        <button className="playlistMenu__item" type="button" onClick={onOpen}>
          {t("common.open")}
        </button>

        <button className="playlistMenu__item" type="button" onClick={onRename}>
          {t("common.rename")}
        </button>

        <button className="playlistMenu__item" type="button" onClick={onChangeCover}>
          {t("common.changeCover")}
        </button>

        <div className="playlistMenu__sep" />

        <button className="playlistMenu__item playlistMenu__item--danger" type="button" onClick={onDelete}>
          {t("common.delete")}
        </button>
      </div>
    </>,
    document.body
  );
}

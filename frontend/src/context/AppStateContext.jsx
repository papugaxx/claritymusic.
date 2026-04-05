

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { readStorage, writeStorage } from "../utils/storage.js";

const RIGHT_PANEL_KEY = "ui.rightPanelOpen";
const LEFT_SIDEBAR_KEY = "ui.leftSidebarOpen";


// Функція нижче інкапсулює окрему частину логіки цього модуля
function readBooleanPref(key, fallback) {
  const value = readStorage(key, null);
  if (value === "1") return true;
  if (value === "0") return false;
  return fallback;
}

const AppStateContext = createContext(null);


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AppStateProvider({ children }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [rightPanelOpen, setRightPanelOpenState] = useState(() => readBooleanPref(RIGHT_PANEL_KEY, false));
  const [leftSidebarOpen, setLeftSidebarOpenState] = useState(() => readBooleanPref(LEFT_SIDEBAR_KEY, false));
  const [likesVersion, setLikesVersion] = useState(0);
  const [playlistsVersion, setPlaylistsVersion] = useState(0);
  const [tracksVersion, setTracksVersion] = useState(0);
  const [playsVersion, setPlaysVersion] = useState(0);
  const [lastPlayEvent, setLastPlayEvent] = useState(null);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const setRightPanelOpen = useCallback((value) => {
    setRightPanelOpenState((prev) => {
      const next = typeof value === "function" ? !!value(prev) : !!value;
      writeStorage(RIGHT_PANEL_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const setLeftSidebarOpen = useCallback((value) => {
    setLeftSidebarOpenState((prev) => {
      const next = typeof value === "function" ? !!value(prev) : !!value;
      writeStorage(LEFT_SIDEBAR_KEY, next ? "1" : "0");
      return next;
    });
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleRightPanel = useCallback(() => {
    setRightPanelOpen((prev) => !prev);
  }, [setRightPanelOpen]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleLeftSidebar = useCallback(() => {
    setLeftSidebarOpen((prev) => !prev);
  }, [setLeftSidebarOpen]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const notifyLikesChanged = useCallback(() => setLikesVersion((value) => value + 1), []);
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const notifyPlaylistsChanged = useCallback(() => setPlaylistsVersion((value) => value + 1), []);
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const notifyTracksChanged = useCallback(() => setTracksVersion((value) => value + 1), []);
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const notifyPlaysChanged = useCallback((payload = null) => {
    setLastPlayEvent(payload);
    setPlaysVersion((value) => value + 1);
  }, []);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const value = useMemo(() => ({
    rightPanelOpen,
    setRightPanelOpen,
    toggleRightPanel,
    leftSidebarOpen,
    setLeftSidebarOpen,
    toggleLeftSidebar,
    likesVersion,
    playlistsVersion,
    tracksVersion,
    playsVersion,
    lastPlayEvent,
    notifyLikesChanged,
    notifyPlaylistsChanged,
    notifyTracksChanged,
    notifyPlaysChanged,
  }), [
    rightPanelOpen,
    setRightPanelOpen,
    toggleRightPanel,
    leftSidebarOpen,
    setLeftSidebarOpen,
    toggleLeftSidebar,
    likesVersion,
    playlistsVersion,
    tracksVersion,
    playsVersion,
    lastPlayEvent,
    notifyLikesChanged,
    notifyPlaylistsChanged,
    notifyTracksChanged,
    notifyPlaysChanged,
  ]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useAppState() {
  const ctx = useContext(AppStateContext);
  if (!ctx) {
    throw new Error("useAppState must be used inside <AppStateProvider>");
  }
  return ctx;
}

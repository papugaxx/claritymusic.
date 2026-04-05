

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useCallback, useEffect, useRef, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "../components/layout/Sidebar.jsx";
import TopBar from "../components/layout/TopBar.jsx";
import RightPanel from "../components/layout/RightPanel.jsx";
import PlayerBar from "../components/player/PlayerBar.jsx";
import SiteFooter from "../components/layout/SiteFooter.jsx";
import MobileBottomNav from "../components/layout/MobileBottomNav.jsx";
import { usePlayerQueueState } from "../context/PlayerContext.jsx";
import { useAppState } from "../context/AppStateContext.jsx";

const MOBILE_SIDEBAR_BREAKPOINT = 980;
const PHONE_BREAKPOINT = 767;


// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function AppLayout() {
  const location = useLocation();
  const { currentTrack } = usePlayerQueueState();
  const {
    rightPanelOpen,
    leftSidebarOpen,
    setLeftSidebarOpen,
    setRightPanelOpen,
  } = useAppState();
  const leftSidebarRef = useRef(null);
  const hasTrack = !!currentTrack;
  const showRight = hasTrack && rightPanelOpen;
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [viewportWidth, setViewportWidth] = useState(() => {
    if (typeof window === "undefined") return 1280;
    return window.innerWidth;
  });

  const isPhoneMode = viewportWidth <= PHONE_BREAKPOINT;
  const isSidebarOverlayMode = viewportWidth <= MOBILE_SIDEBAR_BREAKPOINT && viewportWidth > PHONE_BREAKPOINT;

  
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const closeLeftSidebar = useCallback(() => {
    if (typeof document !== "undefined") {
      const activeElement = document.activeElement;
      if (
        activeElement instanceof HTMLElement
        && (
          activeElement.classList.contains("app-overlay")
          || (leftSidebarRef.current && leftSidebarRef.current.contains(activeElement))
        )
      ) {
        activeElement.blur();
      }
    }

    setLeftSidebarOpen(false);
  }, [setLeftSidebarOpen]);

  // Ефект стежить за шириною вікна і тримає адаптивний стан актуальним
  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    // Нижче оголошено обробник який реагує на дію користувача і змінює стан
    const handleResize = () => {
      setViewportWidth(window.innerWidth);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (!isSidebarOverlayMode) {
      closeLeftSidebar();
    }
  }, [closeLeftSidebar, isSidebarOverlayMode]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (isSidebarOverlayMode) {
      closeLeftSidebar();
    }

    if (isPhoneMode) {
      setRightPanelOpen(false);
    }
  }, [closeLeftSidebar, isPhoneMode, isSidebarOverlayMode, location.pathname, setRightPanelOpen]);

  // Ефект синхронізує класи документа з поточним станом інтерфейсу
  useEffect(() => {
    if (typeof document === "undefined") return undefined;

    document.documentElement.classList.toggle("app-phone-mode", isPhoneMode);
    document.body.classList.toggle("app-phone-mode", isPhoneMode);
    document.body.classList.toggle("app-mobile-nav-open", isSidebarOverlayMode && leftSidebarOpen);
    document.body.classList.toggle("app-phone-panel-open", isPhoneMode && showRight);

    return () => {
      document.documentElement.classList.remove("app-phone-mode");
      document.body.classList.remove("app-phone-mode");
      document.body.classList.remove("app-mobile-nav-open");
      document.body.classList.remove("app-phone-panel-open");
    };
  }, [isPhoneMode, isSidebarOverlayMode, leftSidebarOpen, showRight]);

  // Ефект дозволяє закривати активний елемент через клавішу Escape
  useEffect(() => {
    if (!isSidebarOverlayMode || !leftSidebarOpen || typeof document === "undefined") return undefined;

    // Нижче оголошено обробник який реагує на дію користувача і змінює стан
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        closeLeftSidebar();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [closeLeftSidebar, isSidebarOverlayMode, leftSidebarOpen]);

  // Ефект дозволяє закривати активний елемент через клавішу Escape
  useEffect(() => {
    if (!isPhoneMode || !showRight || typeof document === "undefined") return undefined;

    // Нижче оголошено обробник який реагує на дію користувача і змінює стан
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        setRightPanelOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isPhoneMode, setRightPanelOpen, showRight]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div
      className={[
        "app-shell",
        showRight && !isPhoneMode ? "has-right" : "no-right",
        isSidebarOverlayMode ? "app-shell--sidebar-overlay" : "",
        leftSidebarOpen && isSidebarOverlayMode ? "app-shell--sidebar-open" : "",
        isPhoneMode ? "app-shell--phone" : "",
        showRight && isPhoneMode ? "app-shell--phone-panel-open" : "",
      ].filter(Boolean).join(" ")}
    >
      <div className="app-topstrip">
        <div className="app-topstrip__inner">
          <TopBar />
        </div>
      </div>

      {isSidebarOverlayMode ? (
        <button
          type="button"
          className={`app-overlay ${leftSidebarOpen ? "is-open" : ""}`}
          aria-label="Close navigation menu"
          tabIndex={leftSidebarOpen ? 0 : -1}
          onClick={closeLeftSidebar}
        />
      ) : null}

      <div className={`app-body ${showRight && !isPhoneMode ? "has-right" : "no-right"} ${isPhoneMode ? "app-body--phone" : ""}`}>
        {!isPhoneMode ? (
          <aside
            id="app-left-sidebar"
            ref={leftSidebarRef}
            className={[
              "app-sidebar",
              isSidebarOverlayMode ? "app-sidebar--overlay" : "",
              isSidebarOverlayMode && leftSidebarOpen ? "is-mobile-open" : "",
            ].filter(Boolean).join(" ")}
            data-mobile-open={isSidebarOverlayMode && leftSidebarOpen ? "true" : "false"}
            inert={isSidebarOverlayMode && !leftSidebarOpen ? "" : undefined}
          >
            <div className="app-sticky glass">
              <div className="app-sticky__scroll">
                <Sidebar />
              </div>
            </div>
          </aside>
        ) : null}

        <main className="app-main">
          <div className="app-content">
            <Outlet />
          </div>
          <SiteFooter />
        </main>

        {showRight && !isPhoneMode ? (
          <aside className="app-right">
            <div className="app-sticky glass">
              <div className="app-sticky__scroll">
                <RightPanel />
              </div>
            </div>
          </aside>
        ) : null}
      </div>

      {showRight && isPhoneMode ? (
        <div className="app-phonePlayerScreen" role="dialog" aria-modal="true" aria-label="Now playing">
          <div className="app-phonePlayerScreen__surface">
            <RightPanel mobileFullscreen />
          </div>
        </div>
      ) : null}

      {!(isPhoneMode && showRight) ? (
        <div className="app-player">
          <PlayerBar />
        </div>
      ) : null}

      {isPhoneMode && !showRight ? <MobileBottomNav /> : null}
    </div>
  );
}

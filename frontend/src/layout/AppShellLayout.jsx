

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar.jsx";
import { TopBar } from "./TopBar.jsx";
import { RightPanel } from "./RightPanel.jsx";
import { PlayerBar } from "./PlayerBar.jsx";
import { FooterNav } from "./FooterNav.jsx";
import { useShell } from "../contexts/ShellContext.jsx";
import { usePlayer } from "../contexts/PlayerContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AppShellLayout() {
  const { rightPanelOpen } = useShell();
  const { currentTrack } = usePlayer();
  const showRightPanel = Boolean(rightPanelOpen && currentTrack);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={`appShell ${showRightPanel ? "hasRightPanel" : ""}`.trim()}>
      <div className="appShell__topStrip">
        <div className="appShell__topStripInner">
          <TopBar />
        </div>
      </div>

      <div className={`appShell__body ${showRightPanel ? "hasRightPanel" : ""}`.trim()}>
        <aside className="appShell__sidebarZone">
          <div className="shellScrollSurface">
            <Sidebar />
          </div>
        </aside>

        <main className="appShell__mainZone">
          <div className="appShell__content">
            <Outlet />
          </div>
          <FooterNav />
        </main>

        {showRightPanel ? (
          <aside className="appShell__rightZone">
            <div className="shellScrollSurface">
              <RightPanel />
            </div>
          </aside>
        ) : null}
      </div>

      <div className="appShell__playerStrip">
        <PlayerBar />
      </div>
    </div>
  );
}

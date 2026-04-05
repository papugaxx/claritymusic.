

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useRef, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { AvatarArt } from "../ui/AvatarArt.jsx";
import { MenuItem, MenuPopover, useLayerDismiss, usePopoverStyle } from "../ui/MenuPopover.jsx";
import styles from "./AdminShellLayout.module.css";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AdminShellLayout() {
  const navigate = useNavigate();
  const { me, logout } = useAuth();
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [menuOpen, setMenuOpen] = useState(false);
  const menuAnchorRef = useRef(null);
  const { style: menuStyle, menuRef } = usePopoverStyle(menuOpen, menuAnchorRef, {
    align: "right",
    side: "auto",
    minWidth: 208,
    maxWidth: 236,
    width: 220,
    estimatedHeight: 180,
  });

  useLayerDismiss(menuOpen, [menuAnchorRef, menuRef], () => setMenuOpen(false));

  const displayName = String(me?.displayName || me?.name || me?.username || "Admin").trim() || "Admin";

  async function handleLogout() {
    await logout();
    navigate("/login", { replace: true });
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <div className={styles.brandBlock}>
          <strong className={styles.panelTitle}>Admin panel</strong>
          <span className={styles.brandMeta}>CLARITY.music</span>
        </div>

        <nav className={styles.nav}>
          <span className={styles.navLabel}>Sections</span>
          <NavLink to="/admin/tracks" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`.trim()}>
            Tracks
          </NavLink>
          <NavLink to="/admin/genres" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`.trim()}>
            Genres
          </NavLink>
          <NavLink to="/admin/moods" className={({ isActive }) => `${styles.navItem} ${isActive ? styles.navItemActive : ""}`.trim()}>
            Moods
          </NavLink>
        </nav>
      </aside>

      <div className={styles.main}>
        <header className={styles.topbar}>
          <button type="button" className={styles.appPill} onClick={() => navigate("/app")}>App</button>

          <div className={styles.profileArea}>
            <button ref={menuAnchorRef} type="button" className="profileButton" onClick={() => setMenuOpen((value) => !value)} aria-expanded={menuOpen}>
              <AvatarArt src={me?.avatarUrl} name={displayName} className="profileButton__avatar" />
              <span className="profileButton__name">{displayName}</span>
              <span className="profileButton__caret">▾</span>
            </button>

            <MenuPopover open={menuOpen} style={menuStyle} menuRef={menuRef}>
              <MenuItem onClick={() => { setMenuOpen(false); navigate("/app/me"); }}>My profile</MenuItem>
              <MenuItem onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}>Settings</MenuItem>
              <MenuItem danger onClick={async () => { setMenuOpen(false); await handleLogout(); }}>Log out</MenuItem>
            </MenuPopover>
          </div>
        </header>

        <div className={styles.content}>
          <Outlet />
        </div>
      </div>
    </div>
  );
}

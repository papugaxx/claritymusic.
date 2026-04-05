

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useMemo, useRef, useState } from "react";
import { Navigate, Outlet, useNavigate } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar.jsx";
import ArtistAvatar from "../components/media/ArtistAvatar.jsx";
import { FloatingMenu, FloatingMenuItem, FloatingMenuSeparator, useFloatingStyle, useOutsideClose } from "../components/ui/FloatingMenu.jsx";
import { useAuth } from "../hooks/useAuth.jsx";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { toAbs } from "../services/media.js";
import { isAdmin } from "../utils/auth.js";


// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function AdminLayout() {
  const navigate = useNavigate();
  const { me, loading, logout } = useAuth();
  const { t } = useI18n();
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const hasAdminAccess = useMemo(() => isAdmin(me), [me]);
  const profileAvatarUrl = toAbs(me?.avatarUrl || me?.avatar || "");
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [menuOpen, setMenuOpen] = useState(false);
  const profileRootRef = useRef(null);
  const profileAnchorRef = useRef(null);
  const profileMenuStyle = useFloatingStyle(menuOpen, profileAnchorRef, { align: "right", widthMode: "fixed", minWidth: 208, gap: 8, maxWidth: 240 });

  useOutsideClose(menuOpen, profileRootRef, () => setMenuOpen(false));

  if (loading) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return <div className="admin-page"><div className="admin-card admin-state-card">{t("common.loading")}</div></div>;
  }

  if (!me?.isAuthenticated) return <Navigate to="/login" replace />;

  if (!hasAdminAccess) {
    // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
    return (
      <div className="admin-page">
        <div className="admin-card admin-state-card">
          <h2 className="admin-state-title">{t("admin.title")}</h2>
          <div className="admin-state-text">{t("admin.accessDenied")}</div>
          <div className="admin-state-actions">
            <button className="admin-btn" onClick={() => navigate("/app")} type="button">
              {t("admin.backToApp")}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="admin-shell">
      <AdminSidebar />
      <div className="admin-main">
        <div className="admin-top">
          <button className="admin-pill" onClick={() => navigate("/app")} type="button">
            {t("admin.app")}
          </button>
          <div className="u-flex-1" />

          <div className="profile-menu admin-profileMenu" ref={profileRootRef}>
            <div className="topbar__menuAnchor" data-ui-dd-root ref={profileAnchorRef}>
              <button
                className="profile-btn"
                onClick={() => setMenuOpen((value) => !value)}
                title={me?.email || t("common.profile")}
                type="button"
                aria-expanded={menuOpen}
              >
                <ArtistAvatar
                  src={profileAvatarUrl}
                  name={me?.name || me?.username || me?.email || "Profile"}
                  className="profile-avatar"
                  imgClassName="profile-avatar__img"
                  aria-hidden="true"
                />
                <span className="profile-name">{me?.name || me?.username || t("common.profile")}</span>
                <span className="profile-caret">▾</span>
              </button>

              <FloatingMenu open={menuOpen} align="right" className="topbarProfileMenu adminPortalMenu" style={profileMenuStyle} portal role="menu">
                <FloatingMenuItem onClick={() => { setMenuOpen(false); navigate("/app/me"); }}>
                  {t("common.profile")}
                </FloatingMenuItem>
                <FloatingMenuItem onClick={() => { setMenuOpen(false); navigate("/app/settings"); }}>
                  {t("common.settings")}
                </FloatingMenuItem>
                <FloatingMenuItem active onClick={() => { setMenuOpen(false); navigate("/admin/tracks"); }}>
                  {t("common.adminPanel")}
                </FloatingMenuItem>
                <FloatingMenuSeparator />
                <FloatingMenuItem danger onClick={async () => { setMenuOpen(false); await logout(); navigate("/login"); }}>
                  {t("common.logout")}
                </FloatingMenuItem>
              </FloatingMenu>
            </div>
          </div>
        </div>

        <div className="admin-outlet">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

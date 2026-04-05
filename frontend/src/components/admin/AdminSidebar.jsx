

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { NavLink } from "react-router-dom";
import { useI18n } from "../../i18n/I18nProvider.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function NavItem({ to, children }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <NavLink
      to={to}
      className={({ isActive }) => "admin-nav-item" + (isActive ? " is-active" : "")}
      end
    >
      {children}
    </NavLink>
  );
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function AdminSidebar() {
  const { t } = useI18n();

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <div>
          <div className="admin-brand__title">{t("admin.title")}</div>
          <div className="admin-brand__sub">CLARITY.music</div>
        </div>
      </div>

      <div className="admin-nav">
        <div className="admin-nav__label">{t("admin.sections")}</div>
        <NavItem to="/admin/tracks">{t("admin.tracks")}</NavItem>
        <NavItem to="/admin/genres">{t("admin.genres")}</NavItem>
        <NavItem to="/admin/moods">{t("admin.moods")}</NavItem>
      </div>

    </aside>
  );
}

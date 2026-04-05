

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth.jsx";
import { useI18n } from "../../i18n/I18nProvider.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function NavIcon({ children }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <span className="app-mobileNav__icon" aria-hidden="true">{children}</span>;
}

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function MobileBottomNav() {
  const navigate = useNavigate();
  const { me } = useAuth();
  const { t } = useI18n();
  const isAuthed = !!me?.isAuthenticated;

  const profileTarget = isAuthed ? "/app/me" : "/login";

  const items = [
    { to: "/app", label: t("common.home"), icon: "⌂", end: true },
    { to: "/app/library", label: t("playlists.library"), icon: "▤" },
    { to: profileTarget, label: t("common.profile"), icon: "◉" },
  ];

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <nav className="app-mobileNav glass" aria-label={t("common.navigation")}> 
      {items.map((item) => (
        <NavLink
          key={`${item.to}-${item.label}`}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `app-mobileNav__item${isActive ? " is-active" : ""}`}
          onClick={(event) => {
            if (!isAuthed && item.to === "/login") {
              event.preventDefault();
              navigate("/login");
            }
          }}
        >
          <NavIcon>{item.icon}</NavIcon>
          <span className="app-mobileNav__label">{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

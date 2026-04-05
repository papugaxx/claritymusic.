

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { NavLink } from "react-router-dom";
import { Brand } from "../ui/Brand.jsx";
import { useAuth } from "../contexts/AuthContext.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function FooterNav() {
  const { me } = useAuth();

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <footer className="footerNav surface">
      <div className="footerNav__brand">
        <Brand />
        <p>Nothing stops the music</p>
      </div>

      <div className="footerNav__links">
        <NavLink to="/app">Go home</NavLink>
        <NavLink to="/app/liked">Liked tracks</NavLink>
        <NavLink to="/app/me">My profile</NavLink>
        <NavLink to="/app/settings">Account</NavLink>
        <NavLink to="/app/settings">Settings</NavLink>
        {me?.isAdmin ? <NavLink to="/admin/tracks">Admin panel</NavLink> : null}
      </div>

      <div className="footerNav__copyright">© 2026 CLARITY.music</div>
    </footer>
  );
}

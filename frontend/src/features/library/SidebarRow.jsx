

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { NavLink } from "react-router-dom";
import CoverArt from "../../components/media/CoverArt.jsx";
import { truncateSidebarText } from "./sidebarStorage.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function LibraryRow({ to, title, subtitle, img, coverNode = null, onOpen, actions, isMenuOpen = false }) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={`libRow ${isMenuOpen ? "is-menu-open" : ""}`}>
      <NavLink to={to} className="libRow__link" onClick={onOpen}>
        {coverNode ? coverNode : <CoverArt src={img} title={title} className="libRow__img" />}

        <div className="libRow__meta">
          <div className="libRow__title" title={title}>
            {truncateSidebarText(title)}
          </div>
          {subtitle ? <div className="libRow__sub">{subtitle}</div> : null}
        </div>
      </NavLink>

      {actions ? <div className="libRow__actions">{actions}</div> : null}
    </div>
  );
}

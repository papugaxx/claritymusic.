

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Brand } from "./Brand.jsx";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AuthFrame({
  title = "",
  subtitle = "",
  brandTagline = "",
  children,
  footer = null,
  compact = false,
}) {
  const isEntry = compact && !title;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="authPage">
      <div className={`authCard surface ${compact ? "authCard--compact" : ""}`.trim()}>
        <div className={`authHeader ${isEntry ? "authHeader--entry" : ""}`.trim()}>
          <div className="authBrandWrap">
            <Brand />
          </div>
          {brandTagline ? <div className="authHeader__tagline">{brandTagline}</div> : null}
          {title ? <h1 className="authHeader__title">{title}</h1> : null}
          {subtitle ? <p className="authHeader__subtitle">{subtitle}</p> : null}
        </div>
        {children}
        {footer ? <div className="authFooter">{footer}</div> : null}
      </div>
    </div>
  );
}

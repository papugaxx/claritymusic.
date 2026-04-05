

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import { Link, useRouteError } from "react-router-dom";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function RouteError() {
  const error = useRouteError();
  const message = error?.statusText || error?.message || "Something went wrong.";

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className="sp-page sp-page--profile">
      <div className="sp-card sp-section">
        <div className="sp-h">Щось пішло не так</div>
        <div className="sp-section__sub">{message}</div>
        <div className="sp-actions" style={{ marginTop: 16 }}>
          <Link className="sp-btn sp-btn--primary" to="/app">На головну</Link>
        </div>
      </div>
    </div>
  );
}

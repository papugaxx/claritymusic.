

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function HomeTrackSection({
  title,
  status,
  error,
  emptyText,
  loadingText = null,
  items,
  renderItem,
  actions = null,
}) {
  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <>
      <div className="home__sectionHead">
        <div className="home__title">{title}</div>
      </div>

      <div className="home__card glass">
        {loadingText && status === "loading" ? <div className="home__mutedState">{loadingText}</div> : null}
        {status === "hard-error" ? <div className="home__mutedState">{error}</div> : null}
        {status !== "hard-error" && items.length > 0 ? <div className="row">{items.map(renderItem)}</div> : null}
        {status === "empty" ? <div className="home__mutedState">{emptyText}</div> : null}
        {actions}
      </div>
    </>
  );
}

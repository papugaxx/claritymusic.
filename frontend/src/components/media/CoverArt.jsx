

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import SmartImage from "./SmartImage.jsx";
import { getCoverPlaceholder } from "../../services/media.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function CoverArt({
  src,
  title = "Track",
  alt = "cover",
  className = "",
  imgClassName = "",
  icon,
  ...props
}) {
  const cls = ["media-thumb", "media-thumb--cover", className].filter(Boolean).join(" ");
  const imgCls = ["media-thumb__img", imgClassName].filter(Boolean).join(" ");
  const fallbackSrc = getCoverPlaceholder(title || "Track");

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={cls} {...props}>
      <SmartImage className={imgCls} src={src} fallbackSrc={fallbackSrc} alt={alt} />
      {icon ? <span className="media-thumb__icon">{icon}</span> : null}
    </div>
  );
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import React from "react";
import SmartImage from "./SmartImage.jsx";
import { getAvatarPlaceholder } from "../../services/media.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function ArtistAvatar({
  src,
  name = "Artist",
  alt,
  className = "",
  imgClassName = "",
  ...props
}) {
  const cls = ["media-thumb", "media-thumb--avatar", className].filter(Boolean).join(" ");
  const imgCls = ["media-thumb__img", imgClassName].filter(Boolean).join(" ");
  const fallbackSrc = getAvatarPlaceholder(name || "Artist");

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <div className={cls} {...props}>
      <SmartImage className={imgCls} src={src} fallbackSrc={fallbackSrc} alt={alt || name || "artist avatar"} />
    </div>
  );
}

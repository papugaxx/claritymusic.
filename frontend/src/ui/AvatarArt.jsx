

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { getAvatarPlaceholder, toAbs } from "../services/media.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function AvatarArt({ src = "", name = "User", className = "", imgClassName = "", shape = "circle" }) {
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const fallback = useMemo(() => getAvatarPlaceholder(name, shape), [name, shape]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const resolved = useMemo(() => toAbs(src) || fallback, [src, fallback]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [imageSrc, setImageSrc] = useState(resolved);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    setImageSrc(resolved);
  }, [resolved]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <span className={`avatarArt ${shape === "square" ? "avatarArt--square" : ""} ${className}`.trim()}>
      <img
        src={imageSrc}
        alt={name}
        className={`avatarArt__img ${imgClassName}`.trim()}
        loading="lazy"
        onError={() => {
          if (imageSrc !== fallback) setImageSrc(fallback);
        }}
      />
    </span>
  );
}

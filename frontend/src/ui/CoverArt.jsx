

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useEffect, useMemo, useState } from "react";
import { getCoverPlaceholder, toAbs } from "../services/media.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function CoverArt({ src = "", title = "Track", className = "", imgClassName = "", onClick = null }) {
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const fallback = useMemo(() => getCoverPlaceholder(title), [title]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const resolved = useMemo(() => toAbs(src) || fallback, [src, fallback]);
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [imageSrc, setImageSrc] = useState(resolved);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    setImageSrc(resolved);
  }, [resolved]);

  const coverSpan = (
    <span className={`coverArt ${typeof onClick === "function" ? "" : className}`.trim()}>
      <img
        src={imageSrc}
        alt={title}
        className={`coverArt__img ${imgClassName}`.trim()}
        loading="lazy"
        onError={() => {
          if (imageSrc !== fallback) setImageSrc(fallback);
        }}
      />
    </span>
  );

  if (typeof onClick !== "function") return coverSpan;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <button type="button" className={`coverArtButton ${className}`.trim()} onClick={onClick} aria-label={title}>
      <span className="coverArt">
        <img
          src={imageSrc}
          alt={title}
          className={`coverArt__img ${imgClassName}`.trim()}
          loading="lazy"
          onError={() => {
            if (imageSrc !== fallback) setImageSrc(fallback);
          }}
        />
      </span>
    </button>
  );
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { useMemo, useState } from "react";
import { toAbs } from "../../services/media.js";

// Головний компонент файла збирає логіку станів і розмітку цього екрана
export default function SmartImage({ src, fallbackSrc = "", alt = "", onError, ...props }) {
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const normalizedSrc = useMemo(() => toAbs(src), [src]);
  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const normalizedFallback = useMemo(() => toAbs(fallbackSrc), [fallbackSrc]);
  const sourceKey = `${normalizedSrc}__${normalizedFallback}`;
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [failedKey, setFailedKey] = useState("");

  const currentSrc = failedKey === sourceKey
    ? (normalizedFallback || "")
    : (normalizedSrc || normalizedFallback || "");

  if (!currentSrc) return null;

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <img
      {...props}
      key={sourceKey}
      src={currentSrc}
      alt={alt}
      loading={props.loading || "lazy"}
      onError={(event) => {
        if (normalizedFallback && currentSrc !== normalizedFallback) {
          setFailedKey(sourceKey);
        }
        onError?.(event);
      }}
    />
  );
}

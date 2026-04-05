

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { toAbs } from "../../services/media.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normalizeTrackSource(track) {
  const src = toAbs(track?.audioUrl || "");
  return {
    src,
    key: src ? `${track?.id ?? "unknown"}::${src}` : "",
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function shouldReloadTrackSource(currentSourceKey, track) {
  const nextSource = normalizeTrackSource(track);
  return {
    ...nextSource,
    shouldReload: nextSource.key !== currentSourceKey,
  };
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import { reportDevError } from "./runtime.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function formatSeconds(sec) {
  const total = Math.max(0, Math.floor(Number(sec || 0)));
  const minutes = Math.floor(total / 60);
  const seconds = total % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

export async function getMp3DurationSec(file, options = {}) {
  const { scope = "audioMetadata", zeroAsNull = false } = options;

  return new Promise((resolve) => {
    try {
      const url = URL.createObjectURL(file);
      const audio = new Audio();
      audio.preload = "metadata";
      audio.src = url;

      // Нижче зібране локальне обчислення яке використовується у цьому блоці
      const done = (value) => {
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          reportDevError(`${scope}.revokeObjectUrl`, error);
        }
        resolve(value);
      };

      audio.onloadedmetadata = () => {
        const duration = Number(audio.duration || 0);
        if (!duration && zeroAsNull) {
          done(null);
          return;
        }
        done(Math.max(1, Math.round(duration)));
      };
      audio.onerror = () => done(null);
    } catch (error) {
      reportDevError(`${scope}.readMp3Duration`, error);
      resolve(null);
    }
  });
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import { reportDevError } from "../utils/runtime.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function waitForAudioReady(audio) {
  if (!audio) return Promise.resolve();
  if (audio.readyState >= 1) return Promise.resolve();

  return new Promise((resolve) => {
    let settled = false;
    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const done = () => {
      if (settled) return;
      settled = true;
      cleanup();
      resolve();
    };
    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const cleanup = () => {
      audio.removeEventListener("loadedmetadata", done);
      audio.removeEventListener("canplay", done);
      audio.removeEventListener("error", done);
    };

    audio.addEventListener("loadedmetadata", done, { once: true });
    audio.addEventListener("canplay", done, { once: true });
    audio.addEventListener("error", done, { once: true });
  });
}

export async function restorePlaybackPosition(audio, currentTime, shouldResume, playNow) {
  if (!audio) return;

  await waitForAudioReady(audio);

  if (Number.isFinite(currentTime) && currentTime > 0) {
    try {
      const safeDuration = Number(audio.duration || 0);
      const bounded = safeDuration > 0 ? Math.min(currentTime, Math.max(0, safeDuration - 0.25)) : currentTime;
      audio.currentTime = bounded;
    } catch (error) {
      reportDevError("player.restorePlaybackPosition", error);
    }
  }

  if (shouldResume) {
    await playNow();
  }
}

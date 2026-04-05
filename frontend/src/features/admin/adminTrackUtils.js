

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { formatSeconds, getMp3DurationSec as readMp3DurationSec } from "../../utils/audio.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function formatSec(sec) {
  return formatSeconds(sec);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normName(value) {
  return String(value || "").trim().toLowerCase();
}

export async function getMp3DurationSec(file) {
  return readMp3DurationSec(file, { scope: "adminTracks" });
}

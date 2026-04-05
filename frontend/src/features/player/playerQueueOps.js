

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { buildShuffledQueue, findTrackIndexById } from "../../services/playerPlayback.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
function patchTrackList(list, trackId, patch) {
  const safeList = Array.isArray(list) ? list : [];
  return safeList.map((item) => (item?.id === trackId ? { ...item, ...patch } : item));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function patchTrackAcrossQueues({ queue, baseQueue, trackId, patch }) {
  return {
    queue: patchTrackList(queue, trackId, patch),
    baseQueue: patchTrackList(baseQueue, trackId, patch),
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function removeTrackAcrossQueues({ queue, baseQueue, currentIndex, trackId }) {
  const safeQueue = Array.isArray(queue) ? queue : [];
  const safeBaseQueue = Array.isArray(baseQueue) ? baseQueue : [];
  const filteredQueue = safeQueue.filter((item) => Number(item?.id) !== Number(trackId));
  const filteredBaseQueue = safeBaseQueue.filter((item) => Number(item?.id) !== Number(trackId));

  if (filteredQueue.length === 0) {
    return {
      queue: [],
      baseQueue: filteredBaseQueue,
      currentIndex: -1,
      nextTrack: null,
    };
  }

  const numericIndex = Number(currentIndex);
  const safeIndex = Number.isFinite(numericIndex) ? numericIndex : 0;
  const nextIndex = Math.max(0, Math.min(safeIndex, filteredQueue.length - 1));

  return {
    queue: filteredQueue,
    baseQueue: filteredBaseQueue,
    currentIndex: nextIndex,
    nextTrack: filteredQueue[nextIndex] ?? null,
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function resolvePlayTrackQueue({ track, contextQueue, currentQueue, baseQueue, isShuffled }) {
  const safeCurrentQueue = Array.isArray(currentQueue) ? currentQueue : [];
  const safeBaseQueue = Array.isArray(baseQueue) ? baseQueue : [];

  if (Array.isArray(contextQueue) && contextQueue.length > 0) {
    const targetIndex = contextQueue.findIndex((item) => item?.id === track.id);
    const safeIndex = targetIndex >= 0 ? targetIndex : 0;

    if (isShuffled) {
      return {
        queue: buildShuffledQueue(contextQueue, track.id),
        baseQueue: contextQueue,
        currentIndex: 0,
        historyMode: "reset",
      };
    }

    return {
      queue: contextQueue,
      baseQueue: contextQueue,
      currentIndex: safeIndex,
      historyMode: "none",
    };
  }

  const existingIndex = findTrackIndexById(safeCurrentQueue, track.id);
  if (existingIndex >= 0) {
    return {
      queue: safeCurrentQueue,
      baseQueue: safeBaseQueue.length > 0 ? safeBaseQueue : safeCurrentQueue,
      currentIndex: existingIndex,
      historyMode: isShuffled ? "reset" : "none",
    };
  }

  return {
    queue: [track],
    baseQueue: [track],
    currentIndex: 0,
    historyMode: isShuffled ? "reset" : "none",
  };
}

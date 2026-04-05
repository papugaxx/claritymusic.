

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { buildNextShuffleCycle, findTrackIndexById } from "../../services/playerPlayback.js";
import { appendShuffleHistoryState } from "./playerHistory.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getNextSequentialIndex(queue, currentIndex, { wrap = false } = {}) {
  const safeQueue = Array.isArray(queue) ? queue : [];
  if (safeQueue.length === 0) return -1;
  if (currentIndex < 0 || currentIndex >= safeQueue.length) return 0;
  if (currentIndex < safeQueue.length - 1) return currentIndex + 1;
  return wrap ? 0 : -1;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getPrevSequentialIndex(queue, currentIndex, { wrap = false } = {}) {
  const safeQueue = Array.isArray(queue) ? queue : [];
  if (safeQueue.length === 0) return -1;
  if (currentIndex < 0 || currentIndex >= safeQueue.length) return 0;
  if (currentIndex > 0) return currentIndex - 1;
  return wrap ? Math.max(safeQueue.length - 1, 0) : -1;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function resolveShuffleNext({ queue, baseQueue, currentIndex, history, pointer, currentTrackId }) {
  const safeQueue = Array.isArray(queue) ? queue : [];
  if (safeQueue.length === 0) return null;

  const safeHistory = Array.isArray(history) ? history : [];
  const safePointer = Number.isFinite(pointer) ? pointer : -1;

  if (safePointer >= 0 && safePointer < safeHistory.length - 1) {
    const nextTrackId = safeHistory[safePointer + 1];
    const historyIndex = findTrackIndexById(safeQueue, nextTrackId);
    if (historyIndex >= 0) {
      return {
        queue: safeQueue,
        currentIndex: historyIndex,
        history: safeHistory,
        pointer: safePointer + 1,
        historyMode: "none",
      };
    }
  }

  if (currentIndex >= 0 && currentIndex < safeQueue.length - 1) {
    const nextTrackId = safeQueue[currentIndex + 1]?.id ?? null;
    const nextHistory = appendShuffleHistoryState(safeHistory, safePointer, nextTrackId);

    return {
      queue: safeQueue,
      currentIndex: currentIndex + 1,
      history: nextHistory.history,
      pointer: nextHistory.pointer,
      historyMode: "none",
    };
  }

  const sourceQueue = Array.isArray(baseQueue) && baseQueue.length > 0 ? baseQueue : safeQueue;
  const nextCycle = buildNextShuffleCycle(sourceQueue, currentTrackId);
  if (nextCycle.length === 0) return null;

  const nextTrackId = nextCycle[0]?.id ?? null;
  const nextHistory = appendShuffleHistoryState(safeHistory, safePointer, nextTrackId);

  return {
    queue: nextCycle,
    currentIndex: 0,
    history: nextHistory.history,
    pointer: nextHistory.pointer,
    historyMode: "none",
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function resolveShufflePrev({ queue, currentIndex, history, pointer }) {
  const safeQueue = Array.isArray(queue) ? queue : [];
  if (safeQueue.length === 0) return null;

  const safeHistory = Array.isArray(history) ? history : [];
  const safePointer = Number.isFinite(pointer) ? pointer : -1;

  if (safePointer > 0) {
    const prevTrackId = safeHistory[safePointer - 1];
    const historyIndex = findTrackIndexById(safeQueue, prevTrackId);
    if (historyIndex >= 0) {
      return {
        queue: safeQueue,
        currentIndex: historyIndex,
        history: safeHistory,
        pointer: safePointer - 1,
        historyMode: "none",
      };
    }
  }

  const prevIndex = getPrevSequentialIndex(safeQueue, currentIndex, { wrap: true });
  if (prevIndex < 0) return null;

  return {
    queue: safeQueue,
    currentIndex: prevIndex,
    history: safeHistory,
    pointer: safePointer,
    historyMode: "none",
  };
}

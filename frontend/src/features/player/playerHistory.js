

// Функція нижче інкапсулює окрему частину логіки цього модуля

export function createEmptyShuffleHistory() {
  return { history: [], pointer: -1 };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function resetShuffleHistoryState(trackId) {
  if (!trackId) return createEmptyShuffleHistory();
  return { history: [trackId], pointer: 0 };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function appendShuffleHistoryState(history, pointer, trackId) {
  if (!trackId) return {
    history: Array.isArray(history) ? history.slice() : [],
    pointer: Number.isFinite(pointer) ? pointer : -1,
  };

  const safeHistory = Array.isArray(history) ? history : [];
  const safePointer = Number.isFinite(pointer) ? pointer : -1;
  const trimmed = safePointer >= 0 ? safeHistory.slice(0, safePointer + 1) : [];
  trimmed.push(trackId);

  return {
    history: trimmed,
    pointer: trimmed.length - 1,
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function removeTrackFromShuffleHistoryState(history, pointer, trackId) {
  if (!trackId) {
    return {
      history: Array.isArray(history) ? history.slice() : [],
      pointer: Number.isFinite(pointer) ? pointer : -1,
    };
  }

  const safeHistory = Array.isArray(history) ? history : [];
  const nextHistory = safeHistory.filter((id) => Number(id) !== Number(trackId));

  return {
    history: nextHistory,
    pointer: nextHistory.length ? Math.min(Number.isFinite(pointer) ? pointer : -1, nextHistory.length - 1) : -1,
  };
}

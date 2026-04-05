

// Функція нижче інкапсулює окрему частину логіки цього модуля

function sanitizeQueue(list) {
  return Array.isArray(list) ? list.filter(Boolean) : [];
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeIndex(queue, index) {
  if (!Array.isArray(queue) || queue.length === 0) return -1;

  const numericIndex = Number(index);
  if (!Number.isFinite(numericIndex)) return 0;

  if (numericIndex < 0) return 0;
  if (numericIndex >= queue.length) return queue.length - 1;
  return numericIndex;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function createPlayerSnapshot(nextState = {}, currentState = {}) {
  const queue = sanitizeQueue(nextState.queue ?? currentState.queue);
  const rawBaseQueue = nextState.baseQueue ?? currentState.baseQueue;
  const baseQueue = Array.isArray(rawBaseQueue) ? sanitizeQueue(rawBaseQueue) : queue.slice();

  return {
    queue,
    currentIndex: normalizeIndex(queue, nextState.currentIndex ?? currentState.currentIndex ?? -1),
    baseQueue,
    isShuffled: Boolean(nextState.isShuffled ?? currentState.isShuffled ?? false),
    repeatOne: Boolean(nextState.repeatOne ?? currentState.repeatOne ?? false),
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getCurrentTrack(state) {
  if (!state?.queue?.length) return null;
  return state.queue[state.currentIndex] ?? null;
}

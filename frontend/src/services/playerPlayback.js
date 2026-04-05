

// Функція нижче інкапсулює окрему частину логіки цього модуля

export function sameQueueByIds(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;

  for (let i = 0; i < a.length; i += 1) {
    if ((a[i]?.id ?? null) !== (b[i]?.id ?? null)) return false;
  }

  return true;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function shuffleArray(list) {
  const next = Array.isArray(list) ? list.slice() : [];

  for (let i = next.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const tmp = next[i];
    next[i] = next[j];
    next[j] = tmp;
  }

  return next;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function buildShuffledQueue(list, currentId) {
  const source = Array.isArray(list) ? list.slice() : [];
  if (source.length <= 1) return source;

  const currentPos = source.findIndex((item) => item?.id === currentId);
  if (currentPos < 0) return shuffleArray(source);

  const [current] = source.splice(currentPos, 1);
  return [current, ...shuffleArray(source)];
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function buildNextShuffleCycle(list, currentId) {
  const source = Array.isArray(list) ? list.slice() : [];
  if (source.length <= 1) return source;

  const shuffled = shuffleArray(source);
  if (shuffled.length <= 1) return shuffled;

  if (shuffled[0]?.id === currentId) {
    const swapIndex = shuffled.findIndex((item) => item?.id !== currentId);
    if (swapIndex > 0) {
      const tmp = shuffled[0];
      shuffled[0] = shuffled[swapIndex];
      shuffled[swapIndex] = tmp;
    }
  }

  return shuffled;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function findTrackIndexById(list, trackId) {
  if (!Array.isArray(list) || !trackId) return -1;
  return list.findIndex((item) => item?.id === trackId);
}

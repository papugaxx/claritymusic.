

// Функція нижче інкапсулює окрему частину логіки цього модуля

function hasWindow() {
  return typeof window !== "undefined";
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function isStorageAvailable() {
  return hasWindow() && !!window.localStorage;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function isSessionStorageAvailable() {
  return hasWindow() && !!window.sessionStorage;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function readStorage(key, fallback = null) {
  if (!isStorageAvailable()) return fallback;
  try {
    const value = window.localStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function writeStorage(key, value) {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function removeStorage(key) {
  if (!isStorageAvailable()) return false;
  try {
    window.localStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function readSessionStorage(key, fallback = null) {
  if (!isSessionStorageAvailable()) return fallback;
  try {
    const value = window.sessionStorage.getItem(key);
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function writeSessionStorage(key, value) {
  if (!isSessionStorageAvailable()) return false;
  try {
    window.sessionStorage.setItem(key, String(value));
    return true;
  } catch {
    return false;
  }
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function removeSessionStorage(key) {
  if (!isSessionStorageAvailable()) return false;
  try {
    window.sessionStorage.removeItem(key);
    return true;
  } catch {
    return false;
  }
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function readJsonStorage(key, fallback) {
  const raw = readStorage(key, null);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function writeJsonStorage(key, value) {
  return writeStorage(key, JSON.stringify(value));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function readJsonSessionStorage(key, fallback) {
  const raw = readSessionStorage(key, null);
  if (raw == null) return fallback;
  try {
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function writeJsonSessionStorage(key, value) {
  return writeSessionStorage(key, JSON.stringify(value));
}

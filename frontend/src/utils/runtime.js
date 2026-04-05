

// Функція нижче інкапсулює окрему частину логіки цього модуля

export function reportDevError(scope, error) {
  if (!import.meta.env.DEV) return;
  if (typeof console === "undefined" || typeof console.warn !== "function") return;

  const label = scope ? `[${scope}]` : "[runtime]";
  console.warn(label, error);
}

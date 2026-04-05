

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { readStorage } from "../utils/storage.js";
import { normalizeApiPayload, normalizePagedCollection } from "../utils/normalize.js";

const DEFAULT_TIMEOUT_MS = 45000;

export const MIN_SEARCH_QUERY_LENGTH = 2;

// Функція нижче інкапсулює окрему частину логіки цього модуля
function resolveApiBase() {
  const envBase = import.meta.env.VITE_API_BASE;
  if (envBase) return String(envBase).replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const { protocol, hostname, origin } = window.location;
    const isLocalHost = ["localhost", "127.0.0.1", "0.0.0.0"].includes(hostname);

    if (isLocalHost) {
      const runtimeBase = window.__CLARITY_API_BASE__ || readStorage("clarity:apiBase", "");
      if (runtimeBase) return String(runtimeBase).replace(/\/$/, "");
      return `${protocol}//${hostname}:5287`;
    }

    return origin.replace(/\/$/, "");
  }

  return "";
}

export const API_BASE = resolveApiBase();

let csrfTokenCache = "";
let csrfPromise = null;

// Функція нижче інкапсулює окрему частину логіки цього модуля
function shouldAttachCsrf(method) {
  const normalized = String(method || "GET").toUpperCase();
  return !["GET", "HEAD", "OPTIONS", "TRACE"].includes(normalized);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function composeAbortSignal(signals) {
  const validSignals = signals.filter(Boolean);
  if (validSignals.length === 0) {
    return { signal: null, cleanup: () => {} };
  }
  if (validSignals.length === 1) {
    return { signal: validSignals[0], cleanup: () => {} };
  }

  const controller = new AbortController();
  const listeners = [];

  // Нижче зібране локальне обчислення яке використовується у цьому блоці
  const cleanup = () => {
    listeners.splice(0).forEach(({ signal, handler }) => {
      signal.removeEventListener("abort", handler);
    });
  };

  
  // Нижче зібране локальне обчислення яке використовується у цьому блоці
  const abortFrom = (sourceSignal) => {
    if (!controller.signal.aborted) {
      controller.abort(sourceSignal?.reason);
    }
    cleanup();
  };

  for (const signal of validSignals) {
    if (signal.aborted) {
      abortFrom(signal);
      return { signal: controller.signal, cleanup };
    }

    const handler = () => abortFrom(signal);
    listeners.push({ signal, handler });
    signal.addEventListener("abort", handler, { once: true });
  }

  return { signal: controller.signal, cleanup };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function createTimeoutSignal(timeoutMs = DEFAULT_TIMEOUT_MS) {
  if (!Number.isFinite(timeoutMs) || timeoutMs <= 0) {
    return { signal: null, cancel: () => {} };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(new DOMException("Request timed out", "AbortError")), timeoutMs);

  return {
    signal: controller.signal,
    cancel: () => clearTimeout(timer),
  };
}

async function parseJsonResponse(res) {
  const text = await res.text().catch(() => "");
  if (!text) return null;
  try {
    return normalizeApiPayload(JSON.parse(text));
  } catch {
    return text;
  }
}

async function ensureCsrfToken() {
  if (csrfTokenCache) return csrfTokenCache;
  if (!csrfPromise) {
    csrfPromise = fetch(`${API_BASE}/api/csrf/token`, {
      method: "GET",
      credentials: "include",
      headers: { Accept: "application/json" },
    })
      .then(async (res) => {
        const data = await parseJsonResponse(res);
        if (!res.ok) {
          const error =
            (data && typeof data === "object" && (data.error || data.message || data.title)) ||
            (typeof data === "string" ? data : "Не вдалося отримати CSRF-токен");
          throw new Error(String(error || "Не вдалося отримати CSRF-токен"));
        }

        const token = String(data?.csrfToken || data?.requestToken || "");
        if (!token) {
          throw new Error("Сервер не повернув CSRF-токен");
        }

        csrfTokenCache = token;
        return token;
      })
      .catch((error) => {
        csrfTokenCache = "";
        throw error;
      })
      .finally(() => {
        csrfPromise = null;
      });
  }
  return csrfPromise;
}

export async function apiFetch(path, options = {}) {
  async function executeRequest(retryOnCsrfFailure) {
    const method = String(options.method || "GET").toUpperCase();
    const headers = {
      Accept: "application/json",
      ...(options.headers || {}),
    };

    if (shouldAttachCsrf(method)) {
      const csrfToken = await ensureCsrfToken();
      headers["X-CSRF-TOKEN"] = csrfToken;
    }

    const isFormData = typeof FormData !== "undefined" && options.body instanceof FormData;
    const rawBody = options.rawBody === true ? options.body : JSON.stringify(options.body ?? {});

    if (!isFormData && options.body !== undefined && !headers["Content-Type"] && options.rawBody !== true) {
      headers["Content-Type"] = "application/json";
    }

    const timeout = createTimeoutSignal(options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const composedSignal = composeAbortSignal([options.signal, timeout.signal]);
    const signal = composedSignal.signal;

    try {
      const res = await fetch(`${API_BASE}${path}`, {
        ...options,
        method,
        body: isFormData || options.body === undefined ? options.body : rawBody,
        credentials: "include",
        headers,
        signal,
      });

      const status = res.status;
      const data = await parseJsonResponse(res);

      const isCsrfFailure =
        status === 400 &&
        shouldAttachCsrf(method) &&
        /csrf|antiforgery/i.test(
          String(
            (data && typeof data === "object" && (data.error || data.message || data.title)) ||
              (typeof data === "string" ? data : "")
          )
        );

      if (isCsrfFailure && retryOnCsrfFailure) {
        csrfTokenCache = "";
        await ensureCsrfToken();
        return executeRequest(false);
      }

      if (!res.ok) {
        return {
          ok: false,
          status,
          data: null,
          error:
            (data && typeof data === "object" && (data.error || data.message || data.title)) ||
            (typeof data === "string" && data) ||
            `${status} ${res.statusText}`,
        };
      }

      return { ok: true, status, data, error: null };
    } finally {
      composedSignal.cleanup();
      timeout.cancel();
    }
  }

  try {
    return await executeRequest(true);
  } catch (e) {
    const aborted = e?.name === "AbortError";
    const rawMessage = String(e?.message || "");
    const timedOut = aborted && /timed out/i.test(rawMessage);
    return {
      ok: false,
      status: 0,
      data: null,
      error: timedOut ? "Request timed out" : (aborted ? null : rawMessage || "Network error"),
      aborted,
      timedOut,
    };
  }
}

export async function mapResult(resultPromise, mapper) {
  const result = await resultPromise;
  if (!result?.ok) return result;
  return { ...result, data: mapper(result.data) };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function unwrapListData(data) {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  return [];
}

export async function mapListResult(resultPromise, mapper) {
  return mapResult(resultPromise, (data) => unwrapListData(data).map(mapper));
}

export async function mapPagedResult(resultPromise, mapper) {
  return mapResult(resultPromise, (data) => normalizePagedCollection(data, mapper));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function applyQueryOptions(params, options = {}, mappings = {}) {
  Object.entries(mappings).forEach(([sourceKey, targetKey]) => {
    const value = options[sourceKey];
    if (value !== undefined && value !== null && value !== "") {
      params.set(targetKey, String(value));
    }
  });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function apiGet(path, options = {}) {
  return apiFetch(path, { ...options, method: "GET" });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function apiPost(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "POST", body });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function apiPut(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "PUT", body });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function apiPatch(path, body, options = {}) {
  return apiFetch(path, { ...options, method: "PATCH", body });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function apiDelete(path, options = {}) {
  return apiFetch(path, { ...options, method: "DELETE" });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function uploadFile(path, file, fieldName = "file", options = {}) {
  const formData = new FormData();
  formData.append(fieldName, file);
  return apiFetch(path, { ...options, timeoutMs: options.timeoutMs ?? 120000, method: "POST", body: formData, rawBody: true });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function deleteUploadedFile(url) {
  if (!url) return Promise.resolve({ ok: true });
  return apiDelete(`/api/uploads?url=${encodeURIComponent(url)}`);
}

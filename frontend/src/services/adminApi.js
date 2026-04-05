

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { normalizeApiPayload, normalizePagedCollection, normalizeTrack } from "../utils/normalize.js";
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from "./api.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getAdminLookups(options = {}) {
  return apiGet("/api/admin/lookups", options).then((result) => {
    if (!result?.ok) return result;
    return { ...result, data: normalizeApiPayload(result.data) };
  });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getAdminTracks(options = {}) {
  const params = new URLSearchParams();
  if (options.q) params.set("q", String(options.q));
  if (options.sort) params.set("sort", String(options.sort));
  if (options.activeOnly) params.set("activeOnly", "true");
  if (options.take != null) params.set("take", String(options.take));
  if (options.skip != null) params.set("skip", String(options.skip));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return apiGet(`/api/admin/tracks${suffix}`, options).then((result) => {
    if (!result?.ok) return result;
    return { ...result, data: normalizePagedCollection(result.data, normalizeTrack) };
  });
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function createAdminTrack(body) {
  return apiPost("/api/admin/tracks", body);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function updateAdminTrack(id, body) {
  return apiPut(`/api/admin/tracks/${id}`, body);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function patchAdminTrackStatus(id, isActive) {
  return apiPatch(`/api/admin/tracks/${id}/status`, { isActive });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function deleteAdminTrack(id) {
  return apiDelete(`/api/admin/tracks/${id}`);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getAdminGenres(options = {}) {
  return apiGet("/api/admin/genres", options).then((result) => {
    if (!result?.ok) return result;
    return { ...result, data: normalizeApiPayload(result.data) };
  });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function createAdminGenre(name) {
  return apiPost("/api/admin/genres", { name });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function updateAdminGenre(id, name) {
  return apiPut(`/api/admin/genres/${id}`, { name });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function deleteAdminGenre(id) {
  return apiDelete(`/api/admin/genres/${id}`);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getAdminMoods(options = {}) {
  return apiGet("/api/admin/moods", options).then((result) => {
    if (!result?.ok) return result;
    return { ...result, data: normalizeApiPayload(result.data) };
  });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function createAdminMood(name) {
  return apiPost("/api/admin/moods", { name });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function updateAdminMood(id, name) {
  return apiPut(`/api/admin/moods/${id}`, { name });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function deleteAdminMood(id) {
  return apiDelete(`/api/admin/moods/${id}`);
}

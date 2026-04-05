

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { normalizeArtist, normalizeFollowingArtist, normalizePagedCollection, normalizePlaylist, normalizeProfile, normalizeTrack } from "../utils/normalize.js";
import {
  API_BASE,
  MIN_SEARCH_QUERY_LENGTH,
  apiDelete,
  apiFetch,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  applyQueryOptions,
  deleteUploadedFile,
  mapListResult,
  mapPagedResult,
  mapResult,
  uploadFile,
} from "./apiCore.js";

const PLAYLISTS_PAGE_SIZE = 200;
const MAX_PLAYLISTS_AGGREGATE_PAGES = 1000;

export {
  apiDelete,
  apiFetch,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  deleteUploadedFile,
  API_BASE,
  MIN_SEARCH_QUERY_LENGTH,
  uploadFile,
};

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getLikeIds() {
  return apiGet("/api/likes/ids");
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getLikedTracks(options = {}) {
  const params = new URLSearchParams();
  applyQueryOptions(params, options, { take: "take", skip: "skip" });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return mapPagedResult(apiGet(`/api/likes${suffix}`, options), normalizeTrack);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function likeTrack(trackId) {
  return apiPut(`/api/likes/${trackId}`, {});
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function unlikeTrack(trackId) {
  return apiDelete(`/api/likes/${trackId}`);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getRecentTracks(take = 12, options = {}) {
  return mapListResult(apiGet(`/api/me/recent?take=${encodeURIComponent(take)}`, options), normalizeTrack);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getArtists(search = "", options = {}) {
  const params = new URLSearchParams();
  if (search) params.set("q", String(search));
  applyQueryOptions(params, options, { take: "take", skip: "skip" });
  const qs = params.toString() ? `?${params.toString()}` : "";
  return mapListResult(apiGet(`/api/artists${qs}`, options), normalizeArtist);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getArtist(id, options = {}) {
  return mapResult(apiGet(`/api/artists/${id}`, options), normalizeArtist);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getArtistTracks(id, options = {}) {
  const params = new URLSearchParams();
  applyQueryOptions(params, options, { take: "take", skip: "skip" });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return mapPagedResult(apiGet(`/api/artists/${id}/tracks${suffix}`, options), normalizeTrack);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function followArtist(id) {
  return apiPost(`/api/artists/${id}/follow`, {});
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function unfollowArtist(id) {
  return apiDelete(`/api/artists/${id}/follow`);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getMyFollowing(options = {}) {
  const params = new URLSearchParams();
  applyQueryOptions(params, options, { take: "take", skip: "skip" });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return mapPagedResult(apiGet(`/api/me/following${suffix}`, options), normalizeFollowingArtist);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getMyArtistProfile(options = {}) {
  return mapResult(apiGet(`/api/artist/me`, options), normalizeArtist);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function upsertMyArtistProfile(body, options = {}) {
  return mapResult(apiPost(`/api/artist/me`, body, { timeoutMs: 60000, ...options }), normalizeArtist);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getMyArtistTracks(options = {}) {
  const params = new URLSearchParams();
  applyQueryOptions(params, options, { take: "take", skip: "skip" });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return mapPagedResult(apiGet(`/api/artist/me/tracks${suffix}`, options), normalizeTrack);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function createMyArtistTrack(body, options = {}) {
  return apiPost(`/api/artist/me/tracks`, body, { timeoutMs: 60000, ...options });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function updateMyArtistTrack(id, body, options = {}) {
  return apiPut(`/api/artist/me/tracks/${id}`, body, { timeoutMs: 60000, ...options });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function patchMyArtistTrackStatus(id, isActive, options = {}) {
  return apiPatch(`/api/artist/me/tracks/${id}/status`, { isActive }, { timeoutMs: 60000, ...options });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function deleteMyArtistTrack(id, options = {}) {
  return apiDelete(`/api/artist/me/tracks/${id}`, { timeoutMs: 60000, ...options });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getTracks(options = {}) {
  const params = new URLSearchParams();
  if (options.q) params.set("q", options.q);
  if (options.genreId != null) params.set("genreId", String(options.genreId));
  if (options.moodId != null) params.set("moodId", String(options.moodId));
  if (options.sort) params.set("sort", options.sort);
  if (options.take != null) params.set("take", String(options.take));
  if (options.skip != null) params.set("skip", String(options.skip));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return mapPagedResult(apiGet(`/api/tracks${suffix}`, options), normalizeTrack);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getTrack(id, options = {}) {
  return mapResult(apiGet(`/api/tracks/${id}`, options), normalizeTrack);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function registerTrackPlay(id) {
  return apiPost(`/api/tracks/${id}/play`, {});
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getLookups(options = {}) {
  return apiGet("/api/lookups", options);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function getPlaylistsPage(options = {}) {
  const params = new URLSearchParams();
  const take = options.take ?? PLAYLISTS_PAGE_SIZE;
  const skip = options.skip ?? 0;
  params.set("take", String(take));
  params.set("skip", String(skip));
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return mapPagedResult(apiGet(`/api/playlists${suffix}`, options), normalizePlaylist);
}

export async function getPlaylists(options = {}) {
  const pageSize = Number(options.take ?? PLAYLISTS_PAGE_SIZE) || PLAYLISTS_PAGE_SIZE;
  let skip = Number(options.skip ?? 0) || 0;
  let hasMore = true;
  let pageCount = 0;
  let totalCount = 0;
  const items = [];

  while (hasMore && pageCount < MAX_PLAYLISTS_AGGREGATE_PAGES) {
    const pageRes = await getPlaylistsPage({ ...options, take: pageSize, skip });
    if (!pageRes.ok) return pageRes;

    const page = normalizePagedCollection(pageRes.data, normalizePlaylist);
    items.push(...page.items);
    totalCount = page.totalCount;
    hasMore = !!page.hasMore;
    pageCount += 1;

    if (!hasMore) break;
    const nextSkip = Number(page.nextSkip);
    if (!Number.isFinite(nextSkip) || nextSkip <= skip) break;
    skip = nextSkip;
  }

  return {
    ok: true,
    status: 200,
    error: null,
    data: items,
    meta: {
      paged: true,
      pageSize,
      pageCount,
      totalCount,
      fetchedCount: items.length,
    },
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getPlaylist(id, options = {}) {
  const params = new URLSearchParams();
  applyQueryOptions(params, options, { take: "take", skip: "skip", sort: "sort" });
  const suffix = params.toString() ? `?${params.toString()}` : "";
  return mapResult(apiGet(`/api/playlists/${id}${suffix}`, options), normalizePlaylist);
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function createPlaylist(body) {
  return apiPost("/api/playlists", body);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function updatePlaylist(id, body) {
  return apiPut(`/api/playlists/${id}`, body);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function deletePlaylist(id) {
  return apiDelete(`/api/playlists/${id}`);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function addTrackToPlaylist(playlistId, trackId) {
  return apiPost(`/api/playlists/${playlistId}/tracks/${trackId}`);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function removeTrackFromPlaylist(playlistId, trackId) {
  return apiDelete(`/api/playlists/${playlistId}/tracks/${trackId}`);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function playlistHasTrack(playlistId, trackId) {
  return apiGet(`/api/playlists/${playlistId}/tracks/${trackId}/exists`);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getMeProfile(options = {}) {
  return mapResult(apiGet("/api/me/profile", options), normalizeProfile);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function globalSearch(term, options = {}) {
  const query = String(term || "").trim();
  if (query.length < MIN_SEARCH_QUERY_LENGTH) {
    return Promise.resolve({ ok: true, error: null, status: "idle", data: { artists: [], tracks: [], skipped: true }, aborted: false });
  }

  const signal = options.signal;
  return Promise.all([
    getArtists(query, { signal, timeoutMs: options.timeoutMs ?? 10000, take: 6 }),
    getTracks({ q: query, take: 8, ...options, signal }),
  ]).then(([artistsRes, tracksRes]) => {
    if (artistsRes?.aborted || tracksRes?.aborted || signal?.aborted) {
      return { ok: true, error: null, status: "idle", data: { artists: [], tracks: [], skipped: false }, aborted: true };
    }
    const artists = artistsRes.ok && Array.isArray(artistsRes.data) ? artistsRes.data.slice(0, 6) : [];
    const tracks = tracksRes.ok && Array.isArray(tracksRes.data?.items) ? tracksRes.data.items.slice(0, 8) : [];
    const okCount = Number(artistsRes.ok) + Number(tracksRes.ok);
    const failedCount = 2 - okCount;
    const status = failedCount === 0
      ? (artists.length || tracks.length ? "success" : "empty")
      : okCount > 0
        ? (artists.length || tracks.length ? "partial-error" : "hard-error")
        : "hard-error";

    return {
      ok: okCount > 0,
      error: failedCount > 0 ? [artistsRes.error, tracksRes.error].filter(Boolean).join(" • ") || "Search request failed" : null,
      status,
      data: {
        artists,
        tracks,
        skipped: false,
        artistsOk: !!artistsRes.ok,
        tracksOk: !!tracksRes.ok,
      },
      aborted: false,
    };
  });
}

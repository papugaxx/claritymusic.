

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { addTrackToPlaylist, getPlaylists, playlistHasTrack } from "./api.js";

export async function fetchSelectablePlaylistsResult() {
  try {
    const res = await getPlaylists();
    if (!res.ok) return { ok: false, data: [], error: res.error || "Failed to load playlists" };
    return { ok: true, data: Array.isArray(res.data) ? res.data : [], error: null };
  } catch {
    return { ok: false, data: [], error: "Failed to load playlists" };
  }
}

export async function fetchSelectablePlaylists() {
  const res = await fetchSelectablePlaylistsResult();
  return Array.isArray(res.data) ? res.data : [];
}

export async function resolvePlaylistTrackMembership(playlistId, trackId) {
  if (!playlistId || !trackId) return { ok: true, exists: false };

  const res = await playlistHasTrack(playlistId, trackId);
  if (!res.ok) return { ok: false, exists: false, error: res.error || "Failed to check playlist membership" };

  return { ok: true, exists: Boolean(res.data?.exists) };
}

export async function addTrackToPlaylistSafely(playlistId, trackId) {
  if (!playlistId || !trackId) {
    return { ok: false, added: false, alreadyExists: false, error: "Missing playlistId or trackId" };
  }

  const res = await addTrackToPlaylist(playlistId, trackId);
  if (!res.ok) {
    return { ok: false, added: false, alreadyExists: false, error: res.error || "Failed to add track" };
  }

  const alreadyExists = res.data && typeof res.data === "object" && res.data.added === false;
  return {
    ok: true,
    added: !alreadyExists,
    alreadyExists,
    error: null,
  };
}

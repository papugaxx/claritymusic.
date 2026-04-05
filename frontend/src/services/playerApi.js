

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { getLikeIds, getTrack, likeTrack, registerTrackPlay, unlikeTrack } from "./api.js";

export async function loadLikedIdSet() {
  const res = await getLikeIds();
  return res?.ok && Array.isArray(res.data) ? new Set(res.data) : new Set();
}

export async function submitTrackPlay(trackId) {
  if (!trackId) return null;
  const res = await registerTrackPlay(trackId);
  return res?.ok ? res.data : null;
}

export async function toggleTrackLikeRequest(trackId, isCurrentlyLiked) {
  return isCurrentlyLiked ? unlikeTrack(trackId) : likeTrack(trackId);
}

export async function fetchTrackDetails(trackId, options = {}) {
  return getTrack(trackId, options);
}

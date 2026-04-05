

// Функція нижче інкапсулює окрему частину логіки цього модуля

export function pickArtistName(track) {
  return track?.artist?.name || track?.artistName || track?.author || "Unknown artist";
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function pickArtistId(track) {
  return track?.artist?.id || track?.artistId || track?.mainArtistId || null;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function toText(value) {
  if (value == null) return "";
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return String(value);
  if (typeof value === "object") return String(value.name || value.title || value.label || "");
  return String(value);
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeQueueIndex(queue, currentIndex, currentTrackId) {
  if (!Array.isArray(queue) || queue.length === 0) return -1;

  if (Number.isInteger(currentIndex) && currentIndex >= 0 && currentIndex < queue.length) {
    return currentIndex;
  }

  if (currentTrackId != null) {
    const byId = queue.findIndex((item) => item?.id === currentTrackId);
    if (byId >= 0) return byId;
  }

  return 0;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getNextQueueTrack(queue, currentIndex, currentTrackId) {
  const list = Array.isArray(queue) ? queue.filter(Boolean) : [];
  if (list.length <= 1) return null;

  const activeIndex = normalizeQueueIndex(list, currentIndex, currentTrackId);
  if (activeIndex < 0) return null;

  const nextIndex = (activeIndex + 1) % list.length;
  if (nextIndex === activeIndex) return null;
  return list[nextIndex] ?? null;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function pickTrackCover(track) {
  return track?.coverUrl || track?.imageUrl || track?.artworkUrl || track?.thumbnailUrl || track?.cover || "";
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function pickArtistAvatar(entity) {
  return entity?.avatarUrl || entity?.imageUrl || entity?.photoUrl || entity?.pictureUrl || entity?.avatar || "";
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function mergeArtistData(baseArtist, overrideArtist) {
  if (!baseArtist && !overrideArtist) return null;

  return {
    ...(baseArtist || {}),
    ...(overrideArtist || {}),
    id: overrideArtist?.id ?? baseArtist?.id ?? null,
    name: overrideArtist?.name || baseArtist?.name || "",
    avatarUrl: pickArtistAvatar(overrideArtist) || pickArtistAvatar(baseArtist) || "",
    coverUrl: overrideArtist?.coverUrl || overrideArtist?.imageCoverUrl || baseArtist?.coverUrl || "",
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function mergeTrackData(baseTrack, overrideTrack) {
  if (!baseTrack && !overrideTrack) return null;

  return {
    ...(baseTrack || {}),
    ...(overrideTrack || {}),
    id: overrideTrack?.id ?? baseTrack?.id ?? null,
    title: overrideTrack?.title || baseTrack?.title || "",
    coverUrl: pickTrackCover(overrideTrack) || pickTrackCover(baseTrack) || "",
    mood: overrideTrack?.mood || baseTrack?.mood || null,
    moodName:
      overrideTrack?.moodName ||
      overrideTrack?.mood?.name ||
      baseTrack?.moodName ||
      baseTrack?.mood?.name ||
      "",
    genre: overrideTrack?.genre || baseTrack?.genre || null,
    genreName:
      overrideTrack?.genreName ||
      overrideTrack?.genre?.name ||
      baseTrack?.genreName ||
      baseTrack?.genre?.name ||
      "",
    artist: mergeArtistData(baseTrack?.artist, overrideTrack?.artist),
  };
}

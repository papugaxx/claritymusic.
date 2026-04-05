

// Функція нижче інкапсулює окрему частину логіки цього модуля

function isPlainObject(value) {
  return Object.prototype.toString.call(value) === "[object Object]";
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normalizePagedCollection(value, itemNormalizer = (item) => item) {
  const normalizeItems = (items) => (Array.isArray(items) ? items.map(itemNormalizer) : []);

  if (Array.isArray(value)) {
    const items = normalizeItems(value);
    return {
      items,
      totalCount: items.length,
      hasMore: false,
      nextSkip: null,
      skip: 0,
      take: items.length,
    };
  }

  if (!value || typeof value !== "object") {
    return {
      items: [],
      totalCount: 0,
      hasMore: false,
      nextSkip: null,
      skip: 0,
      take: 0,
    };
  }

  const source = camelizeKeys(value);
  const items = normalizeItems(source.items ?? source.results ?? []);
  const skip = Number.isFinite(Number(source.skip)) ? Number(source.skip) : 0;
  const take = Number.isFinite(Number(source.take)) ? Number(source.take) : items.length;
  const rawTotalCount = Number(source.totalCount);
  const totalCount = Number.isFinite(rawTotalCount) && rawTotalCount >= 0 ? rawTotalCount : items.length;
  const hasMore = typeof source.hasMore === "boolean" ? source.hasMore : skip + items.length < totalCount;
  const nextSkip = hasMore
    ? (Number.isFinite(Number(source.nextSkip)) ? Number(source.nextSkip) : skip + items.length)
    : null;

  return {
    ...source,
    items,
    totalCount,
    hasMore,
    nextSkip,
    skip,
    take,
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function toCamelKey(key) {
  return String(key || "")
    .replace(/^[A-Z]/, (m) => m.toLowerCase())
    .replace(/[_-]([a-zA-Z0-9])/g, (_, ch) => String(ch).toUpperCase());
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function camelizeKeys(value) {
  if (Array.isArray(value)) {
    return value.map(camelizeKeys);
  }

  if (!isPlainObject(value)) {
    return value;
  }

  const out = {};
  for (const [rawKey, rawValue] of Object.entries(value)) {
    out[toCamelKey(rawKey)] = camelizeKeys(rawValue);
  }
  return out;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normalizeArtist(value) {
  if (!value || typeof value !== "object") return value;
  const artist = camelizeKeys(value);
  return {
    ...artist,
    id: artist.id ?? null,
    name: artist.name || "",
    avatarUrl: artist.avatarUrl || "",
    coverUrl: artist.coverUrl || "",
    slug: artist.slug || "",
    followersCount: Number(artist.followersCount ?? 0),
    tracksCount: Number(artist.tracksCount ?? 0),
    isFollowing: !!artist.isFollowing,
    isOwnedByCurrentUser: !!artist.isOwnedByCurrentUser,
    ownerUserId: artist.ownerUserId || "",
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normalizeTrack(value) {
  if (!value || typeof value !== "object") return value;
  const track = camelizeKeys(value);
  const artist = track.artist ? normalizeArtist(track.artist) : null;
  const genre = track.genre && typeof track.genre === "object" ? camelizeKeys(track.genre) : null;
  const mood = track.mood && typeof track.mood === "object" ? camelizeKeys(track.mood) : null;

  const genreId = track.genreId ?? genre?.id ?? null;
  const moodId = track.moodId ?? mood?.id ?? null;
  const genreName = track.genreName || genre?.name || "";
  const moodName = track.moodName || mood?.name || "";

  return {
    ...track,
    id: track.id ?? null,
    title: track.title || "",
    durationSec: Number(track.durationSec ?? 0),
    playsCount: Number(track.playsCount ?? 0),
    audioUrl: track.audioUrl || "",
    coverUrl: track.coverUrl || "",
    isActive: track.isActive ?? true,
    artist,
    artistId: track.artistId ?? artist?.id ?? null,
    artistName: track.artistName || artist?.name || "",
    genre,
    genreId,
    genreName,
    mood,
    moodId,
    moodName,
    createdAt: track.createdAt || null,
    addedAt: track.addedAt || null,
    trackCreatedAt: track.trackCreatedAt || null,
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normalizePlaylist(value) {
  if (!value || typeof value !== "object") return value;
  const playlist = camelizeKeys(value);
  return {
    ...playlist,
    id: playlist.id ?? null,
    name: playlist.name || "",
    coverUrl: playlist.coverUrl || "",
    tracks: normalizePagedCollection(playlist.tracks, normalizeTrack),
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normalizeFollowingArtist(value) {
  if (!value || typeof value !== "object") return value;
  const artist = camelizeKeys(value);
  return {
    ...artist,
    artistId: artist.artistId ?? artist.id ?? null,
    artistName: artist.artistName || artist.name || artist.artist?.name || "",
    avatarUrl: artist.avatarUrl || artist.artist?.avatarUrl || "",
    coverUrl: artist.coverUrl || artist.artist?.coverUrl || "",
    createdAt: artist.createdAt || null,
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normalizeProfile(value) {
  if (!value || typeof value !== "object") return value;
  const profile = camelizeKeys(value);
  return {
    ...profile,
    userId: profile.userId || profile.id || "",
    displayName: profile.displayName || profile.name || "",
    avatarUrl: profile.avatarUrl || "",
    updatedAt: profile.updatedAt || null,
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function normalizeApiPayload(value) {
  return camelizeKeys(value);
}

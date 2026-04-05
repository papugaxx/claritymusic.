

// Функція нижче інкапсулює окрему частину логіки цього модуля

export function getHomeSearchQuery(search) {
  const sp = new URLSearchParams(search || "");
  return sp.get("q") || "";
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function formatMinutes(value, t) {
  const total = Number(value || 0);
  if (!Number.isFinite(total) || total <= 0) return null;
  const mins = Math.floor(total / 60);
  if (mins <= 0) return t("home.lessThanMinute");
  return t("home.minutesShort", { count: mins });
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getTrackMoodName(track, moodsList = null) {
  const direct =
    track?.mood?.name ||
    track?.moodName ||
    track?.mood?.title ||
    track?.mood?.label ||
    track?.moodTitle ||
    track?.moodLabel ||
    null;

  if (direct) return direct;

  const moodId = track?.mood?.id ?? track?.moodId ?? track?.moodID ?? null;
  if (moodId == null || !Array.isArray(moodsList)) return null;

  const found = moodsList.find((item) => String(item?.id) === String(moodId));
  return found?.name || found?.title || found?.label || null;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function enrichTrack(track, moodsList = null, genresList = null) {
  if (!track || typeof track !== "object") return track;

  const next = { ...track };

  const genreId = next?.genre?.id ?? next?.genreId ?? next?.genreID ?? null;
  if ((!next.genreName && !next.genre?.name) && genreId != null && Array.isArray(genresList)) {
    const foundGenre = genresList.find((item) => String(item?.id) === String(genreId));
    if (foundGenre?.name) {
      next.genreName = foundGenre.name;
      next.genre = next.genre && typeof next.genre === "object" ? { ...next.genre, name: foundGenre.name } : { id: genreId, name: foundGenre.name };
    }
  }

  const moodName = getTrackMoodName(next, moodsList);
  if (moodName) {
    next.moodName = moodName;
    const moodId = next?.mood?.id ?? next?.moodId ?? next?.moodID ?? null;
    next.mood = next.mood && typeof next.mood === "object" ? { ...next.mood, name: next.mood?.name || moodName } : { id: moodId, name: moodName };
  }

  return next;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function buildFallbackMoods(t) {
  return [
    { id: "all", label: t("home.all") },
    { id: "happy", label: t("home.moodHappy"), keys: ["pop", "dance", "happy", "party", "edm"] },
    { id: "chill", label: t("home.moodChill"), keys: ["chill", "lofi", "ambient", "relax"] },
    { id: "romance", label: t("home.moodRomance"), keys: ["love", "romance", "ballad", "slow"] },
    { id: "drive", label: t("home.moodDrive"), keys: ["rock", "metal", "energy", "fast", "trap"] },
    { id: "focus", label: t("home.moodFocus"), keys: ["focus", "study", "instrumental", "classical"] },
  ];
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function buildMoodOptions(moodsList, fallbackMoods, t) {
  if (Array.isArray(moodsList) && moodsList.length > 0) {
    return [
      { id: "all", label: t("home.all") },
      ...moodsList
        .filter((m) => m && (m.id ?? m.name))
        .map((m) => ({ id: String(m.id), label: String(m.name || "") })),
    ];
  }
  return fallbackMoods;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function buildGenreOptions(genresList, tracksEnriched, t) {
  if (Array.isArray(genresList) && genresList.length > 0) {
    return [
      { id: "all", label: t("home.all") },
      ...genresList
        .filter((g) => g && (g.id ?? g.name))
        .map((g) => ({ id: String(g.id), label: String(g.name || "") })),
    ];
  }

  const set = new Set();
  for (const track of tracksEnriched) {
    const genreName = track?.genre?.name || track?.genreName;
    if (genreName) set.add(genreName);
  }

  const list = Array.from(set).sort((a, b) => String(a).localeCompare(String(b)));
  return [{ id: "all", label: t("home.all") }, ...list.map((item) => ({ id: String(item), label: String(item) }))];
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function buildFavoriteArtists(tracksEnriched) {
  const map = new Map();
  for (const track of tracksEnriched) {
    const artist = track?.artist;
    const name = artist?.name;
    if (!name) continue;
    if (!map.has(name)) map.set(name, artist);
    if (map.size > 18) break;
  }
  return Array.from(map.values());
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function buildHeroDescription({ featured, mood, selectedMoodLabel, t }) {
  if (featured?.title) {
    return t("home.focusedNow", { title: featured.title, artist: featured?.artist?.name ? ` — ${featured.artist.name}` : "" });
  }
  if (mood !== "all") {
    return t("home.moodSelection", { mood: selectedMoodLabel });
  }
  return t("home.heroFallbackText");
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function getMoodIcon(moodOption) {
  if (moodOption?.id === "happy") return "☀";
  if (moodOption?.id === "chill") return "☁";
  if (moodOption?.id === "romance") return "♥";
  if (moodOption?.id === "drive") return "⚡";
  if (moodOption?.id === "focus") return "✦";
  return "♪";
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getLikedTracks, getMeProfile, getMyFollowing, getPlaylists } from "../services/api.js";


// Функція нижче інкапсулює окрему частину логіки цього модуля
function createSectionsState() {
  return {
    profile: { loaded: false, error: "" },
    playlists: { loaded: false, error: "" },
    liked: { loaded: false, error: "" },
    following: { loaded: false, error: "" },
  };
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function isIgnoredAbortResult(result) {
  return !!(result?.aborted && !result?.timedOut);
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
function composeSignals(signals) {
  const valid = signals.filter(Boolean);
  if (valid.length <= 1) return valid[0] || null;
  const controller = new AbortController();
  const listeners = [];
  const cleanup = () => listeners.splice(0).forEach(({ signal, handler }) => signal.removeEventListener("abort", handler));
  
  // Нижче зібране локальне обчислення яке використовується у цьому блоці
  const abortFrom = (source) => {
    if (!controller.signal.aborted) controller.abort(source?.reason);
    cleanup();
  };
  for (const signal of valid) {
    if (signal.aborted) {
      abortFrom(signal);
      return controller.signal;
    }
    const handler = () => abortFrom(signal);
    listeners.push({ signal, handler });
    signal.addEventListener("abort", handler, { once: true });
  }
  return controller.signal;
}


async function readProfileResources(signal) {
  const [profileRes, playlistsRes, likedRes, followingRes] = await Promise.all([
    getMeProfile({ signal }),
    getPlaylists({ signal }),
    getLikedTracks({ signal }),
    getMyFollowing({ signal }),
  ]);

  return { profileRes, playlistsRes, likedRes, followingRes };
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function useProfileData({ enabled, refreshKey, loadErrorMessage }) {
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [profile, setProfile] = useState({ displayName: "", avatarUrl: "" });
  const [playlists, setPlaylists] = useState([]);
  const [liked, setLiked] = useState([]);
  const [following, setFollowing] = useState([]);
  const [sections, setSections] = useState(createSectionsState);
  const reloadAbortRef = useRef(null);
  const reloadRequestIdRef = useRef(0);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const applyResults = useCallback((result) => {
    const { profileRes, playlistsRes, likedRes, followingRes } = result;

    setSections((prev) => ({
      profile: isIgnoredAbortResult(profileRes)
        ? prev.profile
        : {
            loaded: !!profileRes?.ok,
            error: profileRes?.ok ? "" : (profileRes?.error || ""),
          },
      playlists: isIgnoredAbortResult(playlistsRes)
        ? prev.playlists
        : {
            loaded: !!playlistsRes?.ok,
            error: playlistsRes?.ok ? "" : (playlistsRes?.error || ""),
          },
      liked: isIgnoredAbortResult(likedRes)
        ? prev.liked
        : {
            loaded: !!likedRes?.ok,
            error: likedRes?.ok ? "" : (likedRes?.error || ""),
          },
      following: isIgnoredAbortResult(followingRes)
        ? prev.following
        : {
            loaded: !!followingRes?.ok,
            error: followingRes?.ok ? "" : (followingRes?.error || ""),
          },
    }));

    if (profileRes?.ok) {
      setProfile({
        displayName: profileRes.data?.displayName || "",
        avatarUrl: profileRes.data?.avatarUrl || "",
      });
    }
    if (playlistsRes?.ok) {
      setPlaylists(Array.isArray(playlistsRes.data) ? playlistsRes.data : []);
    }
    if (likedRes?.ok) {
      setLiked(Array.isArray(likedRes.data?.items) ? likedRes.data.items : []);
    }
    if (followingRes?.ok) {
      setFollowing(Array.isArray(followingRes.data?.items) ? followingRes.data.items : []);
    }

    const firstError = [profileRes, playlistsRes, likedRes, followingRes]
      .filter((result) => !isIgnoredAbortResult(result))
      .map((result) => result?.error || "")
      .find(Boolean) || "";
    setError(firstError || "");
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const reload = useCallback(async (externalSignal) => {
    if (!enabled) return false;

    reloadAbortRef.current?.abort();
    const controller = new AbortController();
    reloadAbortRef.current = controller;
    const signal = composeSignals([controller.signal, externalSignal]);
    const requestId = reloadRequestIdRef.current + 1;
    reloadRequestIdRef.current = requestId;

    setBusy(true);
    try {
      const result = await readProfileResources(signal);
      if (reloadRequestIdRef.current !== requestId || signal?.aborted) return false;
      applyResults(result);
      return result.profileRes?.ok || result.playlistsRes?.ok || result.likedRes?.ok || result.followingRes?.ok;
    } catch {
      if (!signal?.aborted && reloadRequestIdRef.current === requestId) {
        setError(loadErrorMessage || "");
      }
      return false;
    } finally {
      if (!signal?.aborted && reloadRequestIdRef.current === requestId) setBusy(false);
    }
  }, [applyResults, enabled, loadErrorMessage]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!enabled) {
      reloadAbortRef.current?.abort();
      setBusy(false);
      return undefined;
    }
    const controller = new AbortController();
    reload(controller.signal);
    return () => {
      controller.abort();
      reloadAbortRef.current?.abort();
    };
  }, [enabled, refreshKey, reload]);

  return useMemo(() => ({
    busy,
    error,
    profile,
    playlists,
    liked,
    following,
    sections,
    reload,
    setProfile,
  }), [busy, error, following, liked, playlists, profile, sections, reload]);
}

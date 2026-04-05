

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { loadLikedIdSet, toggleTrackLikeRequest } from "../services/playerApi.js";


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePlayerLikes({ loading, isAuth, likesVersion, notifyLikesChanged }) {
  const likePendingRef = useRef(new Set());
  const likedIdsRef = useRef(new Set());
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [likedIds, setLikedIds] = useState(() => new Set());

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const commitLikedIds = useCallback((value) => {
    likedIdsRef.current = value;
    setLikedIds(value);
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const resetLikedIds = useCallback(() => {
    likePendingRef.current.clear();
    commitLikedIds(new Set());
  }, [commitLikedIds]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const reloadLikedIds = useCallback(async (signal) => {
    if (loading) return false;
    if (!isAuth) {
      resetLikedIds();
      return true;
    }

    try {
      const likedSet = await loadLikedIdSet();
      if (!signal?.aborted) {
        commitLikedIds(likedSet);
      }
      return true;
    } catch {
      return false;
    }
  }, [commitLikedIds, isAuth, loading, resetLikedIds]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    const controller = new AbortController();
    void reloadLikedIds(controller.signal);
    return () => controller.abort();
  }, [reloadLikedIds, likesVersion]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const isLiked = useCallback((trackId) => likedIdsRef.current.has(trackId), []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleLike = useCallback(async (trackId) => {
    if (!trackId) return { ok: false, error: "No trackId" };
    if (loading) return { ok: false, error: "Auth loading" };
    if (!isAuth) return { ok: false, error: "Not authenticated" };
    if (likePendingRef.current.has(trackId)) return { ok: false, error: "Already processing" };

    likePendingRef.current.add(trackId);

    try {
      const currentlyLiked = likedIdsRef.current.has(trackId);
      const res = await toggleTrackLikeRequest(trackId, currentlyLiked);
      if (!res?.ok && res?.error) return res;

      setLikedIds((prev) => {
        const next = new Set(prev);
        if (currentlyLiked) next.delete(trackId);
        else next.add(trackId);
        likedIdsRef.current = next;
        return next;
      });

      notifyLikesChanged();
      return { ok: true, liked: !currentlyLiked };
    } catch (error) {
      return { ok: false, error: error?.message || "toggleLike failed" };
    } finally {
      likePendingRef.current.delete(trackId);
    }
  }, [isAuth, loading, notifyLikesChanged]);

  return useMemo(() => ({
    likedIds,
    isLiked,
    toggleLike,
    setLikedIds: commitLikedIds,
    resetLikedIds,
    reloadLikedIds,
  }), [commitLikedIds, isLiked, likedIds, reloadLikedIds, resetLikedIds, toggleLike]);
}

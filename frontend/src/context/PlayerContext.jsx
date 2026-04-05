

// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { submitTrackPlay } from "../services/playerApi.js";
import { useAuth } from "../hooks/useAuth.jsx";
import { useAppState } from "./AppStateContext.jsx";
import { readStorage, writeStorage } from "../utils/storage.js";
import { buildShuffledQueue, clamp, findTrackIndexById, sameQueueByIds } from "../services/playerPlayback.js";
import { restorePlaybackPosition } from "../services/playerTransport.js";
import { reportDevError } from "../utils/runtime.js";
import { useI18n } from "../i18n/I18nProvider.jsx";
import { usePlayerLikes } from "../hooks/usePlayerLikes.js";
import { createPlayerSnapshot, getCurrentTrack } from "../features/player/playerState.js";
import { createTransportStore } from "../features/player/playerTransportStore.js";
import {
  appendShuffleHistoryState,
  createEmptyShuffleHistory,
  resetShuffleHistoryState,
} from "../features/player/playerHistory.js";
import { getNextSequentialIndex, getPrevSequentialIndex, resolveShuffleNext, resolveShufflePrev } from "../features/player/playerNavigation.js";
import { patchTrackAcrossQueues, resolvePlayTrackQueue } from "../features/player/playerQueueOps.js";
import { shouldReloadTrackSource } from "../features/player/playerSource.js";
import { usePlayerAudioLifecycle } from "../hooks/usePlayerAudioLifecycle.js";
import { usePlayerTrackRefresh } from "../hooks/usePlayerTrackRefresh.js";


const PlayerQueueContext = createContext(null);
const PlayerTransportContext = createContext(null);
const PlayerActionsContext = createContext(null);
const PlayerLikesContext = createContext(null);


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function PlayerProvider({ children }) {
  const { me, loading } = useAuth();
  const { t } = useI18n();
  const { likesVersion, notifyLikesChanged, notifyPlaysChanged, tracksVersion } = useAppState();
  const isAuth = !!me?.isAuthenticated;

  const initialRepeatOne = readStorage("player.repeatOne", "0") === "1";
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [playerState, setPlayerState] = useState(() => createPlayerSnapshot({
    queue: [],
    currentIndex: -1,
    baseQueue: [],
    isShuffled: false,
    repeatOne: initialRepeatOne,
  }));
  const { queue, currentIndex, baseQueue, isShuffled, repeatOne } = playerState;

  const audioRef = useRef(null);
  const queueRef = useRef(queue);
  const indexRef = useRef(currentIndex);
  const baseQueueRef = useRef(baseQueue);
  const isShuffledRef = useRef(isShuffled);
  const repeatOneRef = useRef(repeatOne);
  const volumeRef = useRef(0.8);
  const handleTrackEndedRef = useRef(null);
  const endedGuardRef = useRef(false);
  const shuffleHistoryRef = useRef([]);
  const shuffleHistoryPointerRef = useRef(-1);
  const playAttemptIdRef = useRef(0);
  const playbackSessionRef = useRef(0);
  const trackRefreshRequestRef = useRef(0);
  const sourceStateRef = useRef({ key: "", src: "", trackId: null });
  const tRef = useRef(t);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const transportStore = useMemo(() => createTransportStore({
    isPlaying: false,
    duration: 0,
    position: 0,
  }), []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const setTransportState = useCallback((patch) => transportStore.setState(patch), [transportStore]);
  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const getTransportState = useCallback(() => transportStore.getSnapshot() ?? {
    isPlaying: false,
    duration: 0,
    position: 0,
  }, [transportStore]);

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [volume, setVolume] = useState(() => {
    const stored = Number(readStorage("player.volume", 0.8));
    return Number.isFinite(stored) ? clamp(stored, 0, 1) : 0.8;
  });
  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [playbackError, setPlaybackError] = useState("");

  const {
    isLiked,
    toggleLike,
    resetLikedIds,
  } = usePlayerLikes({
    loading,
    isAuth,
    likesVersion,
    notifyLikesChanged,
  });

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const currentTrack = useMemo(() => getCurrentTrack(playerState), [playerState]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    tRef.current = t;
  }, [t]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const getPlayerSnapshot = useCallback(() => ({
    queue: queueRef.current,
    currentIndex: indexRef.current,
    baseQueue: baseQueueRef.current,
    isShuffled: isShuffledRef.current,
    repeatOne: repeatOneRef.current,
  }), []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const commitPlayerState = useCallback((nextPatch) => {
    const currentSnapshot = getPlayerSnapshot();
    const resolvedPatch = typeof nextPatch === "function" ? nextPatch(currentSnapshot) : nextPatch;
    const nextState = createPlayerSnapshot(resolvedPatch, currentSnapshot);

    queueRef.current = nextState.queue;
    indexRef.current = nextState.currentIndex;
    baseQueueRef.current = nextState.baseQueue;
    isShuffledRef.current = nextState.isShuffled;
    repeatOneRef.current = nextState.repeatOne;
    setPlayerState(nextState);
    return nextState;
  }, [getPlayerSnapshot]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const getShuffleHistorySnapshot = useCallback(() => ({
    history: shuffleHistoryRef.current,
    pointer: shuffleHistoryPointerRef.current,
  }), []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const applyShuffleHistoryState = useCallback((nextState) => {
    shuffleHistoryRef.current = Array.isArray(nextState?.history) ? nextState.history : [];
    shuffleHistoryPointerRef.current = Number.isFinite(nextState?.pointer) ? nextState.pointer : -1;
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const resetShuffleHistory = useCallback((trackId) => {
    applyShuffleHistoryState(resetShuffleHistoryState(trackId));
  }, [applyShuffleHistoryState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const clearShuffleHistory = useCallback(() => {
    applyShuffleHistoryState(createEmptyShuffleHistory());
  }, [applyShuffleHistoryState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const appendShuffleHistory = useCallback((trackId) => {
    applyShuffleHistoryState(
      appendShuffleHistoryState(
        shuffleHistoryRef.current,
        shuffleHistoryPointerRef.current,
        trackId,
      ),
    );
  }, [applyShuffleHistoryState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const getCurrentIdSafe = useCallback(() => queueRef.current?.[indexRef.current]?.id ?? null, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const stopAudioHard = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;

    try {
      audio.pause();
      audio.currentTime = 0;
      audio.removeAttribute("src");
      audio.load?.();
    } catch (error) {
      reportDevError("player.stopAudioHard", error);
    }

    sourceStateRef.current = { key: "", src: "", trackId: null };
    setTransportState({ isPlaying: false, duration: 0, position: 0 });
    endedGuardRef.current = false;
    setPlaybackError("");
  }, [setTransportState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const setSource = useCallback((track, { resetTime = true, forceReload = false } = {}) => {
    const audio = audioRef.current;
    if (!audio) return false;

    const nextSource = shouldReloadTrackSource(sourceStateRef.current.key, track);
    if (!nextSource.src) {
      setPlaybackError(tRef.current("player.missingAudio"));
      return false;
    }

    const mustReload = forceReload || nextSource.shouldReload || !audio.currentSrc;
    if (mustReload) {
      audio.src = nextSource.src;
      audio.load?.();
    }

    sourceStateRef.current = {
      key: nextSource.key,
      src: nextSource.src,
      trackId: track?.id ?? null,
    };

    if (resetTime) {
      try {
        audio.currentTime = 0;
      } catch (error) {
        reportDevError("player.setSource", error);
      }
      setTransportState({ position: 0 });
    }

    setPlaybackError("");
    return true;
  }, [setTransportState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const playNow = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return false;

    try {
      await audio.play();
      setPlaybackError("");
      return true;
    } catch (error) {
      setTransportState({ isPlaying: false });
      setPlaybackError(error?.message || tRef.current("player.startFailed"));
      return false;
    }
  }, [setTransportState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const pauseNow = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.pause();
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const seek = useCallback((sec) => {
    const audio = audioRef.current;
    if (!audio) return;

    const nextTime = Number(sec);
    if (!Number.isFinite(nextTime)) return;

    const safeDuration = Number(audio.duration || getTransportState().duration || 0);
    const bounded = safeDuration > 0 ? clamp(nextTime, 0, safeDuration) : Math.max(0, nextTime);

    try {
      audio.currentTime = bounded;
    } catch {
      return;
    }

    setTransportState({ position: audio.currentTime || bounded });
    endedGuardRef.current = false;
  }, [getTransportState, setTransportState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const firePlayCount = useCallback(async (trackId) => {
    if (!trackId || !isAuth) return null;

    try {
      const playData = await submitTrackPlay(trackId);
      if (playData) {
        notifyPlaysChanged({
          trackId,
          playsCount: Number(playData.playsCount ?? 0),
          deduped: !!playData.deduped,
        });
        return playData;
      }
    } catch (error) {
      reportDevError("player.firePlayCount", error);
    }

    return null;
  }, [isAuth, notifyPlaysChanged]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const patchTrackInPlayerState = useCallback((trackId, patch) => {
    if (!trackId || !patch || typeof patch !== "object") return;

    const currentSnapshot = getPlayerSnapshot();
    const patched = patchTrackAcrossQueues({
      queue: currentSnapshot.queue,
      baseQueue: currentSnapshot.baseQueue,
      trackId,
      patch,
    });

    commitPlayerState({ ...currentSnapshot, ...patched });
  }, [commitPlayerState, getPlayerSnapshot]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const playQueueTarget = useCallback(async (nextState, options = {}) => {
    const {
      countPlay = true,
      preserveTime = false,
      startPaused = false,
      historyMode = "none",
      nextHistoryState = null,
      forceReloadSource = false,
    } = options;

    const targetState = createPlayerSnapshot(nextState, getPlayerSnapshot());
    const track = targetState.queue[targetState.currentIndex] ?? null;
    if (!track?.id) return false;

    const sourceOk = setSource(track, { resetTime: !preserveTime, forceReload: forceReloadSource });
    if (!sourceOk) return false;

    commitPlayerState(targetState);
    endedGuardRef.current = false;

    if (targetState.isShuffled) {
      if (nextHistoryState) applyShuffleHistoryState(nextHistoryState);
      else if (historyMode === "reset") resetShuffleHistory(track.id);
      else if (historyMode === "append") appendShuffleHistory(track.id);
    }

    if (startPaused) {
      pauseNow();
      return true;
    }

    const attemptId = playAttemptIdRef.current + 1;
    playAttemptIdRef.current = attemptId;
    const played = await playNow();
    if (!played || playAttemptIdRef.current !== attemptId) {
      return false;
    }

    if (countPlay) {
      const playData = await firePlayCount(track.id);
      if (playData && Number.isFinite(Number(playData.playsCount))) {
        patchTrackInPlayerState(track.id, { playsCount: Number(playData.playsCount) });
      }
    }

    return true;
  }, [appendShuffleHistory, applyShuffleHistoryState, commitPlayerState, firePlayCount, getPlayerSnapshot, patchTrackInPlayerState, pauseNow, playNow, resetShuffleHistory, setSource]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const resetPlaybackSession = useCallback(() => {
    playbackSessionRef.current += 1;
    trackRefreshRequestRef.current += 1;
    playAttemptIdRef.current += 1;
    stopAudioHard();
    commitPlayerState({
      queue: [],
      currentIndex: -1,
      baseQueue: [],
      isShuffled: false,
      repeatOne: false,
    });
    clearShuffleHistory();
    resetLikedIds();
  }, [clearShuffleHistory, commitPlayerState, resetLikedIds, stopAudioHard]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const syncPlaybackAfterQueueSwap = useCallback(async (nextState, { savedTime = 0, wasPlaying = false, nextHistoryState = null } = {}) => {
    const targetState = createPlayerSnapshot(nextState, getPlayerSnapshot());
    const nextTrack = targetState.queue[targetState.currentIndex] ?? null;
    if (!nextTrack?.id) return false;

    const sourceOk = setSource(nextTrack, { resetTime: false });
    if (!sourceOk) return false;

    commitPlayerState(targetState);
    if (nextHistoryState) applyShuffleHistoryState(nextHistoryState);

    await restorePlaybackPosition(audioRef.current, savedTime, wasPlaying && !!audioRef.current?.paused, playNow);
    setTransportState({ position: Number(audioRef.current?.currentTime || savedTime || 0) });
    return true;
  }, [applyShuffleHistoryState, commitPlayerState, getPlayerSnapshot, playNow, setSource, setTransportState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const next = useCallback(async () => {
    const currentSnapshot = getPlayerSnapshot();
    if (currentSnapshot.isShuffled) {
      const shufflePlan = resolveShuffleNext({
        queue: currentSnapshot.queue,
        baseQueue: currentSnapshot.baseQueue,
        currentIndex: currentSnapshot.currentIndex,
        history: shuffleHistoryRef.current,
        pointer: shuffleHistoryPointerRef.current,
        currentTrackId: getCurrentIdSafe(),
      });
      if (!shufflePlan) return;

      await playQueueTarget({
        ...currentSnapshot,
        queue: shufflePlan.queue,
        currentIndex: shufflePlan.currentIndex,
        baseQueue: currentSnapshot.baseQueue,
      }, {
        historyMode: shufflePlan.historyMode,
        nextHistoryState: { history: shufflePlan.history, pointer: shufflePlan.pointer },
      });
      return;
    }

    const nextIndex = getNextSequentialIndex(currentSnapshot.queue, currentSnapshot.currentIndex, { wrap: true });
    if (nextIndex < 0) return;
    await playQueueTarget({ ...currentSnapshot, currentIndex: nextIndex });
  }, [getCurrentIdSafe, getPlayerSnapshot, playQueueTarget]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const prev = useCallback(async () => {
    if (getTransportState().position > 3) {
      seek(0);
      return;
    }

    const currentSnapshot = getPlayerSnapshot();
    if (currentSnapshot.isShuffled) {
      const shufflePlan = resolveShufflePrev({
        queue: currentSnapshot.queue,
        currentIndex: currentSnapshot.currentIndex,
        history: shuffleHistoryRef.current,
        pointer: shuffleHistoryPointerRef.current,
      });
      if (!shufflePlan) return;

      await playQueueTarget({
        ...currentSnapshot,
        queue: shufflePlan.queue,
        currentIndex: shufflePlan.currentIndex,
        baseQueue: currentSnapshot.baseQueue,
      }, {
        historyMode: shufflePlan.historyMode,
        nextHistoryState: { history: shufflePlan.history, pointer: shufflePlan.pointer },
      });
      return;
    }

    const prevIndex = getPrevSequentialIndex(currentSnapshot.queue, currentSnapshot.currentIndex, { wrap: true });
    if (prevIndex < 0) return;
    await playQueueTarget({ ...currentSnapshot, currentIndex: prevIndex });
  }, [getPlayerSnapshot, getTransportState, playQueueTarget, seek]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleShuffle = useCallback(async () => {
    const currentSnapshot = getPlayerSnapshot();
    const q = currentSnapshot.queue;
    if (!Array.isArray(q) || q.length === 0) {
      commitPlayerState({ ...currentSnapshot, isShuffled: !currentSnapshot.isShuffled });
      clearShuffleHistory();
      return;
    }

    const currentId = getCurrentIdSafe();
    const audio = audioRef.current;
    const savedTime = Number(audio?.currentTime || 0);
    const wasPlaying = !!audio && !audio.paused;

    if (!currentSnapshot.isShuffled) {
      const originalQueue = currentSnapshot.baseQueue.length > 0 ? currentSnapshot.baseQueue : q;
      const shuffledQueue = buildShuffledQueue(originalQueue, currentId);
      const nextIndex = currentId ? Math.max(findTrackIndexById(shuffledQueue, currentId), 0) : 0;

      await syncPlaybackAfterQueueSwap({
        ...currentSnapshot,
        queue: shuffledQueue,
        currentIndex: nextIndex,
        baseQueue: originalQueue,
        isShuffled: true,
      }, {
        savedTime,
        wasPlaying,
        nextHistoryState: resetShuffleHistoryState(currentId || shuffledQueue[nextIndex]?.id || null),
      });
      return;
    }

    const originalQueue = currentSnapshot.baseQueue.length > 0 ? currentSnapshot.baseQueue : q;
    const restoreIndex = currentId ? findTrackIndexById(originalQueue, currentId) : 0;
    const safeIndex = restoreIndex >= 0 ? restoreIndex : 0;

    const swapped = await syncPlaybackAfterQueueSwap({
      ...currentSnapshot,
      queue: originalQueue,
      currentIndex: safeIndex,
      baseQueue: originalQueue,
      isShuffled: false,
    }, {
      savedTime,
      wasPlaying,
      nextHistoryState: createEmptyShuffleHistory(),
    });

    if (swapped) clearShuffleHistory();
  }, [clearShuffleHistory, commitPlayerState, getCurrentIdSafe, getPlayerSnapshot, syncPlaybackAfterQueueSwap]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleRepeatOne = useCallback(() => {
    commitPlayerState((currentSnapshot) => ({
      ...currentSnapshot,
      repeatOne: !currentSnapshot.repeatOne,
    }));
  }, [commitPlayerState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const restartCurrentTrack = useCallback(async ({ countPlay = false } = {}) => {
    const audio = audioRef.current;
    const track = queueRef.current?.[indexRef.current] ?? null;
    if (!audio || !track?.id) return false;

    endedGuardRef.current = false;

    try {
      audio.currentTime = 0;
    } catch {
      return false;
    }

    setTransportState({ position: 0 });
    const played = await playNow();
    if (played && countPlay) {
      const playData = await firePlayCount(track.id);
      if (playData && Number.isFinite(Number(playData.playsCount))) {
        patchTrackInPlayerState(track.id, { playsCount: Number(playData.playsCount) });
      }
    }

    return played;
  }, [firePlayCount, patchTrackInPlayerState, playNow, setTransportState]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const handleTrackEnded = useCallback(async () => {
    if (endedGuardRef.current) return;
    endedGuardRef.current = true;

    if (repeatOneRef.current) {
      await restartCurrentTrack();
      return;
    }

    if (isShuffledRef.current) {
      await next();
      return;
    }

    const currentSnapshot = getPlayerSnapshot();
    const nextIndex = getNextSequentialIndex(currentSnapshot.queue, currentSnapshot.currentIndex, { wrap: true });
    if (nextIndex >= 0) {
      await playQueueTarget({ ...currentSnapshot, currentIndex: nextIndex });
      return;
    }

    setTransportState({ isPlaying: false });
    endedGuardRef.current = false;
  }, [getPlayerSnapshot, next, playQueueTarget, restartCurrentTrack, setTransportState]);

  // Ефект запускає оновлення даних коли змінюються потрібні залежності
  useEffect(() => {
    handleTrackEndedRef.current = handleTrackEnded;
  }, [handleTrackEnded]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const togglePlayPause = useCallback(async () => {
    const audio = audioRef.current;
    if (!audio) return;

    if (!getCurrentTrack(getPlayerSnapshot()) && queueRef.current.length > 0) {
      await playQueueTarget({ ...getPlayerSnapshot(), currentIndex: Math.max(0, indexRef.current) });
      return;
    }

    if (audio.paused) {
      const safeDuration = Number(audio.duration || getTransportState().duration || 0);
      const safeTime = Number(audio.currentTime || 0);
      const isEnded = safeDuration > 0 && safeTime >= safeDuration - 0.25;

      if (isEnded) {
        if (repeatOneRef.current) {
          await restartCurrentTrack({ countPlay: true });
          return;
        }

        const currentSnapshot = getPlayerSnapshot();
        const nextIndex = getNextSequentialIndex(currentSnapshot.queue, currentSnapshot.currentIndex, { wrap: true });
        if (nextIndex >= 0 && nextIndex !== currentSnapshot.currentIndex) {
          await playQueueTarget({ ...currentSnapshot, currentIndex: nextIndex });
          return;
        }

        await restartCurrentTrack({ countPlay: true });
        return;
      }

      endedGuardRef.current = false;
      await playNow();
      return;
    }

    pauseNow();
  }, [getPlayerSnapshot, getTransportState, pauseNow, playNow, playQueueTarget, restartCurrentTrack]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const playTrack = useCallback(async (track, contextQueue = null) => {
    if (!track?.id) return;

    const currentSnapshot = getPlayerSnapshot();
    const currentId = getCurrentIdSafe();
    const currentLogicalQueue = currentSnapshot.isShuffled
      ? (currentSnapshot.baseQueue.length > 0 ? currentSnapshot.baseQueue : currentSnapshot.queue)
      : currentSnapshot.queue;
    const sameLogicalQueue = Array.isArray(contextQueue)
      && contextQueue.length > 0
      && (
        sameQueueByIds(currentLogicalQueue, contextQueue)
        || sameQueueByIds(currentSnapshot.queue, contextQueue)
      );

    if (
      currentId
      && track.id === currentId
      && sameLogicalQueue
    ) {
      await togglePlayPause();
      return;
    }

    if (currentId && track.id === currentId && (!Array.isArray(contextQueue) || contextQueue.length === 0)) {
      await togglePlayPause();
      return;
    }

    const nextQueueState = resolvePlayTrackQueue({
      track,
      contextQueue,
      currentQueue: currentSnapshot.queue,
      baseQueue: currentSnapshot.baseQueue,
      isShuffled: currentSnapshot.isShuffled,
    });

    await playQueueTarget({
      ...currentSnapshot,
      queue: nextQueueState.queue,
      currentIndex: nextQueueState.currentIndex,
      baseQueue: nextQueueState.baseQueue,
    }, {
      historyMode: nextQueueState.historyMode,
    });
  }, [getCurrentIdSafe, getPlayerSnapshot, playQueueTarget, togglePlayPause]);

  usePlayerAudioLifecycle({
    audioRef,
    volumeRef,
    tRef,
    setTransportState,
    setPlaybackError,
    endedGuardRef,
    handleTrackEndedRef,
  });

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.loop = false;
  }, [repeatOne, currentTrack, queue]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    writeStorage("player.volume", String(volume));
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    writeStorage("player.repeatOne", repeatOne ? "1" : "0");
  }, [repeatOne]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (loading) return;
    if (!isAuth) {
      resetPlaybackSession();
    }
  }, [loading, isAuth, resetPlaybackSession]);

  usePlayerTrackRefresh({
    tracksVersion,
    trackRefreshRequestRef,
    playbackSessionRef,
    getCurrentIdSafe,
    getPlayerSnapshot,
    getShuffleHistorySnapshot,
    sourceStateRef,
    commitPlayerState,
    applyShuffleHistoryState,
    stopAudioHard,
    playQueueTarget,
    audioRef,
    setSource,
    playNow,
    setTransportState,
  });

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const queueValue = useMemo(() => ({
    queue,
    currentIndex,
    currentTrack,
    isShuffled,
    repeatOne,
    playbackError,
  }), [queue, currentIndex, currentTrack, isShuffled, repeatOne, playbackError]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const transportValue = useMemo(() => ({
    transportStore,
    volume,
  }), [transportStore, volume]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const actionsValue = useMemo(() => ({
    playTrack,
    togglePlayPause,
    next,
    prev,
    toggleShuffle,
    toggleRepeatOne,
    seek,
    setVolume,
  }), [next, playTrack, prev, seek, togglePlayPause, toggleRepeatOne, toggleShuffle]);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const likesValue = useMemo(() => ({
    isLiked,
    toggleLike,
  }), [isLiked, toggleLike]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return (
    <PlayerQueueContext.Provider value={queueValue}>
      <PlayerTransportContext.Provider value={transportValue}>
        <PlayerActionsContext.Provider value={actionsValue}>
          <PlayerLikesContext.Provider value={likesValue}>{children}</PlayerLikesContext.Provider>
        </PlayerActionsContext.Provider>
      </PlayerTransportContext.Provider>
    </PlayerQueueContext.Provider>
  );
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
function useRequiredPlayerContext(context, hookName) {
  const value = useContext(context);
  if (!value) throw new Error(`${hookName} must be used inside <PlayerProvider>`);
  return value;
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePlayerQueueState() {
  return useRequiredPlayerContext(PlayerQueueContext, "usePlayerQueueState");
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePlayerTransportState() {
  const { transportStore, volume } = useRequiredPlayerContext(PlayerTransportContext, "usePlayerTransportState");
  const snapshot = useSyncExternalStore(transportStore.subscribe, transportStore.getSnapshot, transportStore.getSnapshot);
  return useMemo(() => ({ ...snapshot, volume }), [snapshot, volume]);
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePlayerActions() {
  return useRequiredPlayerContext(PlayerActionsContext, "usePlayerActions");
}


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePlayerLikesState() {
  return useRequiredPlayerContext(PlayerLikesContext, "usePlayerLikesState");
}



// Нижче підключаються залежності без яких цей модуль не працюватиме

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { getLikeIds, likeTrack, registerTrackPlay, unlikeTrack } from "../services/api.js";
import { toAbs } from "../services/media.js";
import { useAuth } from "./AuthContext.jsx";

const PlayerContext = createContext(null);

// Функція нижче інкапсулює окрему частину логіки цього модуля
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function normalizeQueue(tracks) {
  return Array.isArray(tracks) ? tracks.filter(Boolean) : [];
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
function pickRandomIndex(length, excludeIndex) {
  if (length <= 1) return excludeIndex;
  let nextIndex = excludeIndex;
  while (nextIndex === excludeIndex) {
    nextIndex = Math.floor(Math.random() * length);
  }
  return nextIndex;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function PlayerProvider({ children }) {
  const { me } = useAuth();
  const audioRef = useRef(null);
  const playLoggedRef = useRef(null);
  const suppressPauseRef = useRef(false);
  const queueRef = useRef([]);
  const indexRef = useRef(-1);
  const isShuffledRef = useRef(false);
  const repeatOneRef = useRef(false);
  const isPlayingRef = useRef(false);
  const historyRef = useRef([]);

  // Цей стан зберігає локальне значення яке впливає на поведінку компонента
  const [queue, setQueue] = useState([]);
  const [index, setIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolumeState] = useState(0.85);
  const [likedIds, setLikedIds] = useState(() => new Set());
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatOne, setRepeatOne] = useState(false);
  const [likesVersion, setLikesVersion] = useState(0);

  const currentTrack = index >= 0 ? queue[index] ?? null : null;
  const currentTrackRef = useRef(currentTrack);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => { queueRef.current = queue; }, [queue]);
  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => { indexRef.current = index; }, [index]);
  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => { isShuffledRef.current = isShuffled; }, [isShuffled]);
  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => { repeatOneRef.current = repeatOne; }, [repeatOne]);
  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => { currentTrackRef.current = currentTrack; }, [currentTrack]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const moveToIndex = useCallback((nextIndex, { remember = true } = {}) => {
    const normalizedQueue = queueRef.current;
    if (!normalizedQueue.length) return false;

    const clampedIndex = clamp(Number(nextIndex), 0, normalizedQueue.length - 1);
    const currentIndex = indexRef.current;
    if (remember && currentIndex >= 0 && currentIndex !== clampedIndex) {
      historyRef.current = [...historyRef.current, currentIndex].slice(-100);
    }

    setIndex(clampedIndex);
    return clampedIndex !== currentIndex;
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const resolveNextIndex = useCallback((currentIndex) => {
    const normalizedQueue = queueRef.current;
    if (!normalizedQueue.length) return -1;
    if (isShuffledRef.current) return pickRandomIndex(normalizedQueue.length, clamp(currentIndex, 0, normalizedQueue.length - 1));
    const linearNext = currentIndex + 1;
    if (linearNext >= normalizedQueue.length) return -1;
    return linearNext;
  }, []);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    if (!audioRef.current) audioRef.current = new Audio();
    const audio = audioRef.current;
    audio.volume = volume;

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handleTimeUpdate() {
      setPosition(audio.currentTime || 0);
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handleLoadedMetadata() {
      setDuration(Number(audio.duration || 0));
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handlePause() {
      if (suppressPauseRef.current) {
        suppressPauseRef.current = false;
        return;
      }
      setIsPlaying(false);
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handlePlay() {
      setIsPlaying(true);
    }

    // Функція нижче інкапсулює окрему частину логіки цього модуля
    function handleEnded() {
      const normalizedQueue = queueRef.current;
      const currentIndex = indexRef.current;
      if (!normalizedQueue.length || currentIndex < 0) {
        setIsPlaying(false);
        return;
      }

      if (repeatOneRef.current && audio.src) {
        suppressPauseRef.current = true;
        audio.currentTime = 0;
        setPosition(0);
        setIsPlaying(true);
        audio.play().catch(() => {
          suppressPauseRef.current = false;
          setIsPlaying(false);
        });
        return;
      }

      const nextIndex = resolveNextIndex(currentIndex);
      if (nextIndex < 0) {
        setIsPlaying(false);
        return;
      }

      suppressPauseRef.current = true;
      moveToIndex(nextIndex);
      setIsPlaying(true);
    }

    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("loadedmetadata", handleLoadedMetadata);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("play", handlePlay);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("loadedmetadata", handleLoadedMetadata);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("play", handlePlay);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [moveToIndex, resolveNextIndex, volume]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    let alive = true;
    if (!me?.isAuthenticated) {
      setLikedIds(new Set());
      return undefined;
    }

    getLikeIds().then((res) => {
      if (!alive) return;
      setLikedIds(new Set(Array.isArray(res?.data) ? res.data.map((item) => Number(item)) : []));
    });

    return () => {
      alive = false;
    };
  }, [me?.isAuthenticated, likesVersion]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack?.audioUrl) {
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      setPosition(0);
      setDuration(0);
      return;
    }

    audio.src = toAbs(currentTrack.audioUrl);
    audio.load();
    setPosition(0);
    setDuration(Number(currentTrack.durationSec || 0));
    playLoggedRef.current = null;

    if (isPlayingRef.current) {
      audio.play().catch(() => setIsPlaying(false));
    }
  }, [currentTrack]);

  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!currentTrack?.audioUrl) return;
    if (isPlaying) {
      audio.play().catch(() => setIsPlaying(false));
      return;
    }
    audio.pause();
  }, [isPlaying, currentTrack]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    const audio = audioRef.current;
    if (audio) audio.volume = volume;
  }, [volume]);

  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (!currentTrack?.id || position < 12 || playLoggedRef.current === currentTrack.id) return;
    playLoggedRef.current = currentTrack.id;
    registerTrackPlay(currentTrack.id).catch(() => {});
  }, [currentTrack, position]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const isLiked = useCallback((trackId) => {
    const normalizedId = Number(trackId);
    return likedIds.has(normalizedId);
  }, [likedIds]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const playQueue = useCallback((tracks, startIndex = 0) => {
    const normalizedQueue = normalizeQueue(tracks);
    if (!normalizedQueue.length) return;
    const clampedIndex = clamp(Math.floor(Number(startIndex) || 0), 0, normalizedQueue.length - 1);
    historyRef.current = [];
    setQueue(normalizedQueue);
    setIndex(clampedIndex);
    setIsPlaying(true);
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const playTrack = useCallback((track, tracks = null) => {
    if (!track) return;
    if (Array.isArray(tracks) && tracks.length) {
      const normalizedQueue = normalizeQueue(tracks);
      const nextIndex = normalizedQueue.findIndex((item) => Number(item?.id) === Number(track.id));
      playQueue(normalizedQueue, nextIndex >= 0 ? nextIndex : 0);
      return;
    }
    playQueue([track], 0);
  }, [playQueue]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const togglePlayPause = useCallback(() => {
    if (!currentTrackRef.current) return;
    setIsPlaying((value) => !value);
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const next = useCallback(() => {
    const normalizedQueue = queueRef.current;
    if (!normalizedQueue.length) return;
    if (repeatOneRef.current) {
      const audio = audioRef.current;
      if (audio) {
        audio.currentTime = 0;
        setPosition(0);
      }
      setIsPlaying(true);
      return;
    }

    const nextIndex = resolveNextIndex(indexRef.current);
    if (nextIndex < 0) {
      setIsPlaying(false);
      return;
    }
    moveToIndex(nextIndex);
    setIsPlaying(true);
  }, [moveToIndex, resolveNextIndex]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const prev = useCallback(() => {
    const audio = audioRef.current;
    const normalizedQueue = queueRef.current;
    if (!normalizedQueue.length) return;
    if ((audio?.currentTime || 0) > 3) {
      if (audio) audio.currentTime = 0;
      setPosition(0);
      return;
    }

    if (isShuffledRef.current && historyRef.current.length) {
      const history = [...historyRef.current];
      const previousIndex = history.pop();
      historyRef.current = history;
      if (Number.isFinite(previousIndex)) {
        setIndex(clamp(previousIndex, 0, normalizedQueue.length - 1));
        setIsPlaying(true);
        return;
      }
    }

    setIndex((currentIndex) => Math.max(0, currentIndex - 1));
    setIsPlaying(true);
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const seek = useCallback((value) => {
    const audio = audioRef.current;
    const nextValue = Number(value || 0);
    if (!audio || !Number.isFinite(nextValue)) return;
    audio.currentTime = nextValue;
    setPosition(nextValue);
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const setVolume = useCallback((value) => {
    setVolumeState(clamp(Number(value || 0), 0, 1));
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleLike = useCallback(async (trackId = currentTrackRef.current?.id) => {
    const normalizedId = Number(trackId);
    if (!normalizedId) return { ok: false, error: "Missing track id" };
    const currentlyLiked = likedIds.has(normalizedId);

    setLikedIds((prev) => {
      const nextSet = new Set(prev);
      if (currentlyLiked) nextSet.delete(normalizedId);
      else nextSet.add(normalizedId);
      return nextSet;
    });

    const response = currentlyLiked ? await unlikeTrack(normalizedId) : await likeTrack(normalizedId);
    if (!response?.ok) {
      setLikedIds((prev) => {
        const nextSet = new Set(prev);
        if (currentlyLiked) nextSet.add(normalizedId);
        else nextSet.delete(normalizedId);
        return nextSet;
      });
      return response;
    }

    setLikesVersion((value) => value + 1);
    return response;
  }, [likedIds]);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleShuffle = useCallback(() => {
    setIsShuffled((value) => !value);
  }, []);

  // Цей колбек тримає стабільне посилання на обробник між рендерами
  const toggleRepeatOne = useCallback(() => {
    setRepeatOne((value) => !value);
  }, []);

  // Це обчислення кешує похідне значення щоб уникати зайвих перерахунків
  const value = useMemo(() => ({
    queue,
    currentTrack,
    index,
    isPlaying,
    position,
    duration,
    volume,
    isShuffled,
    repeatOne,
    likesVersion,
    playQueue,
    playTrack,
    playTrackNow: playTrack,
    togglePlayPause,
    next,
    prev,
    seek,
    setVolume,
    toggleLike,
    isLiked,
    toggleShuffle,
    toggleRepeatOne,
  }), [queue, currentTrack, index, isPlaying, position, duration, volume, isShuffled, repeatOne, likesVersion, playQueue, playTrack, togglePlayPause, next, prev, seek, setVolume, toggleLike, isLiked, toggleShuffle, toggleRepeatOne]);

  // Нижче збирається основна розмітка компонента з ключових секцій інтерфейсу
  return <PlayerContext.Provider value={value}>{children}</PlayerContext.Provider>;
}

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used inside PlayerProvider");
  return ctx;
}

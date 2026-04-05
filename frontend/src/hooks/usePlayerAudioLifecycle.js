

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { useEffect } from "react";


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePlayerAudioLifecycle({
  audioRef,
  volumeRef,
  tRef,
  setTransportState,
  setPlaybackError,
  endedGuardRef,
  handleTrackEndedRef,
}) {
  // Ефект узгоджує похідний стан коли змінюються вхідні умови
  useEffect(() => {
    const audio = new Audio();
    audio.preload = "metadata";
    audio.volume = volumeRef.current;
    audio.loop = false;
    audioRef.current = audio;

    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const onPlay = () => {
      setTransportState({ isPlaying: true });
      endedGuardRef.current = false;
      setPlaybackError("");
    };
    const onPause = () => setTransportState({ isPlaying: false });
    const onTimeUpdate = () => setTransportState({ position: audio.currentTime || 0 });
    const onLoadedMetadata = () => setTransportState({ duration: audio.duration || 0 });
    const onDurationChange = () => setTransportState({ duration: audio.duration || 0 });
    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const onSeeking = () => {
      endedGuardRef.current = false;
      setPlaybackError("");
    };
    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const onSeeked = () => {
      setTransportState({ position: audio.currentTime || 0 });
      endedGuardRef.current = false;
    };
    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const onEnded = () => {
      handleTrackEndedRef.current?.().catch(() => {
        endedGuardRef.current = false;
      });
    };
    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const onError = () => {
      setPlaybackError(tRef.current("player.playbackUnavailable"));
      setTransportState({ isPlaying: false });
      endedGuardRef.current = false;
    };
    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const onStalled = () => {
      if (!audio.paused) {
        setPlaybackError(tRef.current("player.networkStalled"));
      }
    };
    // Нижче зібране локальне обчислення яке використовується у цьому блоці
    const onWaiting = () => {
      if (!audio.paused) setPlaybackError(tRef.current("player.buffering"));
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("seeking", onSeeking);
    audio.addEventListener("seeked", onSeeked);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    audio.addEventListener("stalled", onStalled);
    audio.addEventListener("waiting", onWaiting);

    return () => {
      audio.pause();
      audio.removeAttribute("src");
      audio.load?.();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("seeking", onSeeking);
      audio.removeEventListener("seeked", onSeeked);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      audio.removeEventListener("stalled", onStalled);
      audio.removeEventListener("waiting", onWaiting);
    };
  }, [audioRef, endedGuardRef, handleTrackEndedRef, setPlaybackError, setTransportState, tRef, volumeRef]);
}

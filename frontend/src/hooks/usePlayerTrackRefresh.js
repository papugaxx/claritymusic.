

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { useEffect } from "react";
import { fetchTrackDetails } from "../services/playerApi.js";
import { restorePlaybackPosition } from "../services/playerTransport.js";
import { resolveTrackRefresh } from "../features/player/playerRevalidation.js";


// Функція нижче інкапсулює окрему частину логіки цього модуля
export function usePlayerTrackRefresh({
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
}) {
  // Ефект синхронізує стан компонента з подіями або зовнішніми залежностями
  useEffect(() => {
    if (tracksVersion <= 0) return;

    const requestId = trackRefreshRequestRef.current + 1;
    trackRefreshRequestRef.current = requestId;
    const sessionId = playbackSessionRef.current;
    let cancelled = false;
    
    const isStale = () => (
      cancelled
      || playbackSessionRef.current !== sessionId
      || trackRefreshRequestRef.current !== requestId
    );

    (async () => {
      const currentId = getCurrentIdSafe();
      if (!currentId) return;

      const response = await fetchTrackDetails(currentId);
      if (isStale()) return;

      const resolution = resolveTrackRefresh({
        response,
        currentId,
        playerState: getPlayerSnapshot(),
        shuffleHistory: getShuffleHistorySnapshot(),
        sourceKey: sourceStateRef.current.key,
      });
      if (resolution.type === "noop" || isStale()) return;

      if (resolution.type === "clear") {
        commitPlayerState(resolution.nextState);
        applyShuffleHistoryState(resolution.shuffleHistory);
        stopAudioHard();
        return;
      }

      if (resolution.type === "replace-after-removal") {
        const audio = audioRef.current;
        const wasPlaying = !!audio && !audio.paused;
        const played = await playQueueTarget(resolution.nextState, {
          countPlay: wasPlaying,
          startPaused: !wasPlaying,
          nextHistoryState: resolution.shuffleHistory,
          forceReloadSource: true,
        });

        if (!played || isStale()) {
          stopAudioHard();
        }
        return;
      }

      commitPlayerState(resolution.nextState);

      if (!resolution.shouldReloadSource || !resolution.nextTrack?.id || isStale()) {
        return;
      }

      const audio = audioRef.current;
      const savedTime = Number(audio?.currentTime || 0);
      const wasPlaying = !!audio && !audio.paused;
      const sourceOk = setSource(resolution.nextTrack, { resetTime: false, forceReload: true });
      if (!sourceOk || isStale()) {
        stopAudioHard();
        return;
      }

      await restorePlaybackPosition(audioRef.current, savedTime, wasPlaying && !!audioRef.current?.paused, playNow);
      if (!isStale()) {
        setTransportState({ position: Number(audioRef.current?.currentTime || savedTime || 0) });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    applyShuffleHistoryState,
    audioRef,
    commitPlayerState,
    getCurrentIdSafe,
    getPlayerSnapshot,
    getShuffleHistorySnapshot,
    playNow,
    playQueueTarget,
    playbackSessionRef,
    setSource,
    setTransportState,
    sourceStateRef,
    stopAudioHard,
    trackRefreshRequestRef,
    tracksVersion,
  ]);
}

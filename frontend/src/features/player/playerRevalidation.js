

// Нижче підключаються залежності без яких цей модуль не працюватиме

import { appendShuffleHistoryState, removeTrackFromShuffleHistoryState } from "./playerHistory.js";
import { patchTrackAcrossQueues, removeTrackAcrossQueues } from "./playerQueueOps.js";
import { normalizeTrackSource } from "./playerSource.js";

// Функція нижче інкапсулює окрему частину логіки цього модуля
export function resolveTrackRefresh({
  response,
  currentId,
  playerState,
  shuffleHistory,
  sourceKey,
}) {
  if (!currentId) return { type: "noop" };

  if (!response?.ok || response?.data?.isActive === false) {
    const removed = removeTrackAcrossQueues({
      queue: playerState.queue,
      baseQueue: playerState.baseQueue,
      currentIndex: playerState.currentIndex,
      trackId: currentId,
    });
    const nextHistoryState = removeTrackFromShuffleHistoryState(
      shuffleHistory.history,
      shuffleHistory.pointer,
      currentId,
    );

    if (removed.queue.length === 0) {
      return {
        type: "clear",
        nextState: {
          queue: [],
          currentIndex: -1,
          baseQueue: removed.baseQueue,
          isShuffled: playerState.isShuffled,
          repeatOne: playerState.repeatOne,
        },
        shuffleHistory: { history: [], pointer: -1 },
      };
    }

    const nextTrack = removed.nextTrack;
    const finalHistory = playerState.isShuffled && nextTrack?.id
      ? appendShuffleHistoryState(nextHistoryState.history, nextHistoryState.pointer, nextTrack.id)
      : nextHistoryState;

    return {
      type: "replace-after-removal",
      nextState: {
        queue: removed.queue,
        currentIndex: removed.currentIndex,
        baseQueue: removed.baseQueue,
        isShuffled: playerState.isShuffled,
        repeatOne: playerState.repeatOne,
      },
      nextTrack,
      shuffleHistory: finalHistory,
      shouldReloadSource: true,
      resetTime: true,
    };
  }

  const patched = patchTrackAcrossQueues({
    queue: playerState.queue,
    baseQueue: playerState.baseQueue,
    trackId: currentId,
    patch: response.data,
  });
  const refreshedTrack = patched.queue[playerState.currentIndex] ?? null;
  const nextSourceKey = normalizeTrackSource(refreshedTrack).key;

  return {
    type: "patch",
    nextState: {
      queue: patched.queue,
      currentIndex: playerState.currentIndex,
      baseQueue: patched.baseQueue,
      isShuffled: playerState.isShuffled,
      repeatOne: playerState.repeatOne,
    },
    nextTrack: refreshedTrack,
    shuffleHistory,
    shouldReloadSource: Boolean(refreshedTrack?.id) && nextSourceKey !== sourceKey,
  };
}

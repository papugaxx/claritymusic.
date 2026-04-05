

// Функція нижче інкапсулює окрему частину логіки цього модуля

export function createTransportStore(initialState) {
  let state = initialState;
  const listeners = new Set();

  return {
    getSnapshot: () => state,
    subscribe: (listener) => {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    setState: (patch) => {
      const nextPatch = typeof patch === "function" ? patch(state) : patch;
      if (!nextPatch || typeof nextPatch !== "object") return state;

      const nextState = { ...state, ...nextPatch };
      const changed = Object.keys(nextPatch).some((key) => !Object.is(state[key], nextState[key]));
      if (!changed) return state;

      state = nextState;
      listeners.forEach((listener) => listener());
      return state;
    },
  };
}

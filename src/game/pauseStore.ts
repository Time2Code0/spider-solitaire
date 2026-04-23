import { useEffect } from "react";
import { create } from "zustand";

export interface PauseStore {
  pause: () => void;
  pauseCount: number;
  resume: () => void;
}

/**
 * Tiny counter for "something is paused". Each open dialog (or anything else
 * that should freeze the game timer and hotkeys) increments on mount and
 * decrements on unmount. Consumers can either call `pause` / `resume`
 * directly, or use `usePausesTimerWhileOpen(open)` to wire a boolean up.
 *
 * Kept out of `useGameStore` because it's pure UI state and doesn't need to
 * persist across reloads.
 */
export const usePauseStore = create<PauseStore>((set) => ({
  pauseCount: 0,
  pause: () => set((state) => ({ pauseCount: state.pauseCount + 1 })),
  resume: () =>
    set((state) => ({ pauseCount: Math.max(0, state.pauseCount - 1) })),
}));

export function selectIsPaused(state: PauseStore): boolean {
  return state.pauseCount > 0;
}

/**
 * While `open` is true, increment the global pause counter. Decrement on
 * close or unmount. Safe to call with stable or changing booleans.
 */
export function usePausesTimerWhileOpen(open: boolean): void {
  useEffect(() => {
    if (!open) {
      return;
    }
    const { pause, resume } = usePauseStore.getState();
    pause();
    return resume;
  }, [open]);
}

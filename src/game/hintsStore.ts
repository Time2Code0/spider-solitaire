import { create } from "zustand";
import { enumerateLegalMoves } from "./hints";
import { useGameStore } from "./store";
import type { Move } from "./types";

export const HINT_IDLE_MS = 30_000;

export interface HintsStore {
  clearHint: () => void;
  cycleHint: () => void;
  hintIndex: number;
  hintPulseKey: number;
  hintVisible: boolean;
  /**
   * Timestamp of the most recent game mutation (move, deal, undo, etc.). Read
   * by `GameShell`'s idle-hint timer to decide when to auto-show a hint.
   */
  lastMoveAt: number;
}

export const useHintsStore = create<HintsStore>((set, get) => ({
  hintIndex: 0,
  hintVisible: false,
  hintPulseKey: 0,
  lastMoveAt: Date.now(),

  cycleHint() {
    const present = useGameStore.getState().present;
    if (!present || present.completedAt !== null) {
      return;
    }
    const moves: Move[] = enumerateLegalMoves(present);
    if (moves.length === 0) {
      return;
    }
    const { hintIndex, hintVisible } = get();
    const nextIndex = hintVisible ? (hintIndex + 1) % moves.length : 0;
    set({
      hintIndex: nextIndex,
      hintVisible: true,
      hintPulseKey: Date.now(),
    });
  },

  clearHint() {
    if (!get().hintVisible) {
      return;
    }
    set({ hintVisible: false, hintIndex: 0 });
  },
}));

// Subscribe to game-state changes: every time `moveSeq` ticks (i.e. the game
// had a state-changing action), reset the active hint and refresh the idle
// timestamp. Keeps hint state in sync without the game store knowing about it.
let lastSeenMoveSeq = useGameStore.getState().moveSeq;
useGameStore.subscribe((state) => {
  if (state.moveSeq === lastSeenMoveSeq) {
    return;
  }
  lastSeenMoveSeq = state.moveSeq;
  useHintsStore.setState({
    hintIndex: 0,
    hintVisible: false,
    hintPulseKey: 0,
    lastMoveAt: Date.now(),
  });
});

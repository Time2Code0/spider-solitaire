import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyAutoFoundation,
  applyDeal,
  attemptTableauMove,
  canDeal,
  cloneState,
  createInitialState,
  hasAnyLegalMove,
  isWon,
} from "./engine";
import { enumerateLegalMoves } from "./hints";
import { useSettingsStore } from "./settingsStore";
import { playSound } from "./sounds";
import { useStatsStore } from "./statsStore";
import type { Difficulty, GameState, LeaderboardEntry, Move } from "./types";

const MAX_HISTORY = 500;
const HISTORY_TRIM = 400;

export type AttemptMoveResult =
  | { ok: true }
  | { ok: false; reason: "invalid"; column: number }
  | { ok: false; reason: "game-over" };

export interface GameStore {
  attemptMove: (
    from: number,
    cardIndex: number,
    to: number
  ) => AttemptMoveResult;
  deal: () => boolean;
  hasHydrated: boolean;
  markHydrated: () => void;
  /**
   * Monotonically increasing counter that ticks on every state-changing
   * action (move, deal, undo, new game). External stores (e.g. hints) can
   * subscribe to this to observe "something happened" without caring about
   * the actual game state shape.
   */
  moveSeq: number;
  past: GameState[];
  present: GameState | null;
  setElapsedMs: (ms: number) => void;
  startNewGame: (difficulty?: Difficulty) => void;
  undo: () => void;
}

export function pushHistory(past: GameState[], state: GameState): GameState[] {
  const next = [...past, cloneState(state)];
  if (next.length > MAX_HISTORY) {
    return next.slice(next.length - HISTORY_TRIM);
  }
  return next;
}

export type GameOutcome = "won" | "lost" | null;

export function getOutcome(state: GameState | null): GameOutcome {
  if (!state || state.completedAt === null) {
    return null;
  }
  return isWon(state) ? "won" : "lost";
}

function finalizeIfOver(state: GameState): {
  state: GameState;
  outcome: GameOutcome;
} {
  if (isWon(state)) {
    return { state, outcome: "won" };
  }
  // Losses are NOT recorded here so undo can cleanly revert the dead-end move
  // without unwinding stats. The loss is recorded by `startNewGame` when the
  // user commits to starting over (via Play again / New Game).
  if (!hasAnyLegalMove(state)) {
    const lost: GameState = {
      ...state,
      completedAt: state.completedAt ?? Date.now(),
    };
    return { state: lost, outcome: "lost" };
  }
  return { state, outcome: null };
}

function recordWinFor(state: GameState): void {
  const entry: LeaderboardEntry = {
    moves: state.moves,
    elapsedMs: state.elapsedMs,
    finishedAt: state.completedAt ?? Date.now(),
  };
  useStatsStore.getState().recordWin(state.difficulty, entry);
}

const GAME_STORE_KEY = "spider-solitaire/game@1";
const LEGACY_STORE_KEY = "spider-solitaire@1";

// Seeds the new game-store key from the legacy `spider-solitaire@1` bundle on
// first load so an in-progress game survives the upgrade. Runs once at module
// import, before persist middleware reads the new key. Safe to remove after
// one release cycle.
function seedFromLegacyKey(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (window.localStorage.getItem(GAME_STORE_KEY)) {
      return;
    }
    const legacyRaw = window.localStorage.getItem(LEGACY_STORE_KEY);
    if (!legacyRaw) {
      return;
    }
    const parsed = JSON.parse(legacyRaw) as {
      state?: { past?: GameState[]; present?: GameState | null };
    };
    const legacyPresent = parsed.state?.present ?? null;
    const legacyPast = parsed.state?.past ?? [];
    if (legacyPresent === null && legacyPast.length === 0) {
      return;
    }
    window.localStorage.setItem(
      GAME_STORE_KEY,
      JSON.stringify({
        state: { present: legacyPresent, past: legacyPast },
        version: 1,
      })
    );
  } catch {
    // Ignore parse errors; the store will fall back to a fresh game.
  }
}

seedFromLegacyKey();

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      present: null,
      past: [],
      moveSeq: 0,
      hasHydrated: false,

      startNewGame(difficulty) {
        const { present, moveSeq } = get();
        const diff =
          difficulty ?? useSettingsStore.getState().settings.defaultDifficulty;
        // Records a loss when abandoning an in-progress game AND when starting
        // over from a lost end-state (since `finalizeIfOver` doesn't record).
        if (present && !isWon(present) && present.moves > 0) {
          useStatsStore.getState().recordLoss(present.difficulty);
        }
        const fresh = createInitialState(diff);
        set({
          present: fresh,
          past: [],
          moveSeq: moveSeq + 1,
        });
        playSound("deal");
      },

      attemptMove(from, cardIndex, to) {
        const { present, past, moveSeq } = get();
        if (!present || present.completedAt !== null) {
          return { ok: false, reason: "game-over" };
        }
        const result = attemptTableauMove(present, from, cardIndex, to);
        if (!result) {
          playSound("invalid");
          return { ok: false, reason: "invalid", column: to };
        }
        const { state: finalized, outcome } = finalizeIfOver(result);
        const foundationFired =
          finalized.foundations.length > present.foundations.length;
        playSound(foundationFired ? "foundation" : "drop");
        if (outcome === "won") {
          recordWinFor(finalized);
          playSound("win");
        }
        set({
          present: finalized,
          past: pushHistory(past, present),
          moveSeq: moveSeq + 1,
        });
        return { ok: true };
      },

      deal() {
        const { present, past, moveSeq } = get();
        if (!present || present.completedAt !== null) {
          return false;
        }
        if (!canDeal(present)) {
          playSound("invalid");
          return false;
        }
        const result = applyDeal(present);
        if (!result) {
          return false;
        }
        const { state: finalized, outcome } = finalizeIfOver(result);
        playSound("deal");
        if (outcome === "won") {
          recordWinFor(finalized);
          playSound("win");
        }
        set({
          present: finalized,
          past: pushHistory(past, present),
          moveSeq: moveSeq + 1,
        });
        return true;
      },

      undo() {
        const { past, present, moveSeq } = get();
        if (past.length === 0 || !present) {
          return;
        }
        const prev = past.at(-1) as GameState;
        const restored = cloneState(prev);
        restored.moves = present.moves + 1;
        restored.undosUsed = present.undosUsed + 1;
        restored.completedAt = null;
        const finalized = applyAutoFoundation(restored);
        playSound("undo");
        set({
          present: finalized,
          past: past.slice(0, -1),
          moveSeq: moveSeq + 1,
        });
      },

      setElapsedMs(ms) {
        const { present } = get();
        if (!present) {
          return;
        }
        if (present.elapsedMs === ms) {
          return;
        }
        set({ present: { ...present, elapsedMs: ms } });
      },

      markHydrated() {
        set({ hasHydrated: true });
      },
    }),
    {
      name: GAME_STORE_KEY,
      version: 1,
      partialize: (state) => ({
        present: state.present,
        past: state.past,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.markHydrated();
        }
      },
    }
  )
);

export function selectCurrentGame(state: GameStore): GameState | null {
  return state.present;
}

export function selectCanUndo(state: GameStore): boolean {
  // Allow undo while a game is in-progress OR has ended in a loss, so the
  // player can back out of a dead-end move. Blocked once the game is won.
  return (
    state.past.length > 0 && state.present !== null && !isWon(state.present)
  );
}

export function selectCanDeal(state: GameStore): boolean {
  const present = state.present;
  if (!present || present.completedAt !== null) {
    return false;
  }
  return canDeal(present);
}

export function selectHintMoves(state: GameStore): Move[] | null {
  if (!state.present) {
    return null;
  }
  return enumerateLegalMoves(state.present);
}

export function selectLegalMoveExists(state: GameStore): boolean {
  if (!state.present) {
    return false;
  }
  return hasAnyLegalMove(state.present);
}

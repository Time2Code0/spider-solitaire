import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  applyAutoFoundation,
  applyDeal,
  attemptTableauMove,
  canDeal,
  cloneState,
  createInitialState,
  FULL_SUIT_LENGTH,
  hasAnyLegalMove,
  isWon,
  TABLEAU_COLUMNS,
} from "./engine";
import { enumerateLegalMoves } from "./hints";
import { playSound, setSoundsEnabled } from "./sounds";
import { emptyStats, recordLoss, recordWin } from "./stats";
import type {
  Card,
  CardBackId,
  CardFrontId,
  Difficulty,
  GameState,
  LeaderboardEntry,
  Move,
  Settings,
  SoundsMode,
  StatsByDifficulty,
  Suit,
} from "./types";
import { SUITS } from "./types";

const MAX_HISTORY = 500;
const HISTORY_TRIM = 400;

export type DialogName =
  | "settings"
  | "stats"
  | "end-of-game"
  | "confirm-new-game";

export interface GameStore {
  attemptMove: (from: number, cardIndex: number, to: number) => boolean;
  clearHint: () => void;
  closeDialog: (name: DialogName) => void;
  cycleHint: () => void;
  deal: () => boolean;
  devForceLose: () => void;
  devForceWin: () => void;
  hasHydrated: boolean;
  hintIndex: number;
  hintPulseKey: number;
  hintVisible: boolean;
  invalidFlashColumn: number | null;
  isDialogOpen: (name: DialogName) => boolean;
  lastMoveAt: number;
  markHydrated: () => void;
  openDialog: (name: DialogName) => void;
  openDialogs: DialogName[];
  past: GameState[];
  present: GameState | null;
  registerAbandonAsLoss: () => void;
  resetStats: () => void;
  setElapsedMs: (ms: number) => void;
  setInvalidFlash: (column: number | null) => void;
  settings: Settings;
  startNewGame: (difficulty?: Difficulty) => void;
  stats: StatsByDifficulty;
  undo: () => void;
  updateSettings: (patch: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  defaultDifficulty: 4,
  cardFront: "classic",
  cardBack: "crimson",
  sounds: "off",
  confirmNewGame: true,
};

function pushHistory(past: GameState[], state: GameState): GameState[] {
  const next = [...past, cloneState(state)];
  if (next.length > MAX_HISTORY) {
    return next.slice(next.length - HISTORY_TRIM);
  }
  return next;
}

function finalizeIfWon(
  state: GameState,
  stats: StatsByDifficulty
): { state: GameState; stats: StatsByDifficulty; won: boolean } {
  if (!isWon(state)) {
    return { state, stats, won: false };
  }
  const entry: LeaderboardEntry = {
    moves: state.moves,
    elapsedMs: state.elapsedMs,
    finishedAt: state.completedAt ?? Date.now(),
  };
  return {
    state,
    stats: recordWin(stats, state.difficulty, entry),
    won: true,
  };
}

function applySoundsSetting(mode: SoundsMode): void {
  setSoundsEnabled(mode === "on");
}

// Redistribute all cards from the current game into 8 complete foundation
// runs (K→A) so `isWon` returns true and downstream flows (win flourish,
// stats, end-of-game dialog) receive real cards to render.
function buildWinningState(state: GameState): GameState {
  const allCards: Card[] = [
    ...state.tableau.flat(),
    ...state.stock.flat(),
    ...state.foundations.flat(),
  ];

  const bySuit: Record<Suit, Card[]> = { S: [], H: [], D: [], C: [] };
  for (const card of allCards) {
    bySuit[card.suit].push(card);
  }

  const foundations: Card[][] = [];
  for (const suit of SUITS) {
    const cards = bySuit[suit];
    const copies = Math.floor(cards.length / FULL_SUIT_LENGTH);
    for (let copy = 0; copy < copies; copy++) {
      const run = cards
        .slice(copy * FULL_SUIT_LENGTH, (copy + 1) * FULL_SUIT_LENGTH)
        .sort((a, b) => b.rank - a.rank)
        .map((c) => ({ ...c, faceUp: true }));
      foundations.push(run);
    }
  }

  return {
    ...cloneState(state),
    tableau: Array.from({ length: TABLEAU_COLUMNS }, () => []),
    stock: [],
    foundations,
    completedAt: Date.now(),
    moves: state.moves + 1,
  };
}

const END_OF_GAME_DIALOG_DELAY_MS = 2800;

function scheduleEndOfGameDialog(getState: () => GameStore): void {
  if (typeof window === "undefined") {
    getState().openDialog("end-of-game");
    return;
  }
  window.setTimeout(() => {
    const current = getState();
    if (!current.present) {
      return;
    }
    if (current.present.completedAt === null) {
      return;
    }
    current.openDialog("end-of-game");
  }, END_OF_GAME_DIALOG_DELAY_MS);
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      present: null,
      past: [],
      settings: defaultSettings,
      stats: emptyStats(),
      openDialogs: [],
      invalidFlashColumn: null,
      lastMoveAt: Date.now(),
      hintIndex: 0,
      hintVisible: false,
      hintPulseKey: 0,
      hasHydrated: false,

      startNewGame(difficulty) {
        const { present, stats, settings } = get();
        const diff = difficulty ?? settings.defaultDifficulty;
        let nextStats = stats;
        if (present && !isWon(present) && present.moves > 0) {
          nextStats = recordLoss(stats, present.difficulty);
        }
        const fresh = createInitialState(diff);
        set({
          present: fresh,
          past: [],
          stats: nextStats,
          lastMoveAt: Date.now(),
          hintIndex: 0,
          hintVisible: false,
          hintPulseKey: 0,
          invalidFlashColumn: null,
        });
        playSound("deal");
      },

      devForceWin() {
        const { present, past, stats } = get();
        if (!present || isWon(present)) {
          return;
        }
        const winning = buildWinningState(present);
        const entry: LeaderboardEntry = {
          moves: winning.moves,
          elapsedMs: winning.elapsedMs,
          finishedAt: winning.completedAt ?? Date.now(),
        };
        const nextStats = recordWin(stats, winning.difficulty, entry);
        playSound("foundation");
        playSound("win");
        set({
          present: winning,
          past: pushHistory(past, present),
          stats: nextStats,
          lastMoveAt: Date.now(),
          hintIndex: 0,
          hintVisible: false,
          hintPulseKey: 0,
          invalidFlashColumn: null,
        });
        scheduleEndOfGameDialog(get);
      },

      devForceLose() {
        const { present, stats, settings } = get();
        if (!present) {
          return;
        }
        const nextStats = isWon(present)
          ? stats
          : recordLoss(stats, present.difficulty);
        const fresh = createInitialState(settings.defaultDifficulty);
        playSound("invalid");
        set({
          present: fresh,
          past: [],
          stats: nextStats,
          lastMoveAt: Date.now(),
          hintIndex: 0,
          hintVisible: false,
          hintPulseKey: 0,
          invalidFlashColumn: null,
        });
      },

      attemptMove(from, cardIndex, to) {
        const { present, past, stats } = get();
        if (!present || isWon(present)) {
          return false;
        }
        const result = attemptTableauMove(present, from, cardIndex, to);
        if (!result) {
          playSound("invalid");
          set({ invalidFlashColumn: to });
          return false;
        }
        const {
          state: finalized,
          stats: nextStats,
          won,
        } = finalizeIfWon(result, stats);
        const foundationFired =
          finalized.foundations.length > present.foundations.length;
        playSound(foundationFired ? "foundation" : "drop");
        if (won) {
          playSound("win");
        }
        set({
          present: finalized,
          past: pushHistory(past, present),
          stats: nextStats,
          lastMoveAt: Date.now(),
          hintIndex: 0,
          hintVisible: false,
          hintPulseKey: 0,
          invalidFlashColumn: null,
        });
        if (won) {
          scheduleEndOfGameDialog(get);
        }
        return true;
      },

      deal() {
        const { present, past, stats } = get();
        if (!present || isWon(present)) {
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
        const {
          state: finalized,
          stats: nextStats,
          won,
        } = finalizeIfWon(result, stats);
        playSound("deal");
        if (won) {
          playSound("win");
        }
        set({
          present: finalized,
          past: pushHistory(past, present),
          stats: nextStats,
          lastMoveAt: Date.now(),
          hintIndex: 0,
          hintVisible: false,
          hintPulseKey: 0,
          invalidFlashColumn: null,
        });
        if (won) {
          scheduleEndOfGameDialog(get);
        }
        return true;
      },

      undo() {
        const { past, present } = get();
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
          lastMoveAt: Date.now(),
          hintIndex: 0,
          hintVisible: false,
          hintPulseKey: 0,
          invalidFlashColumn: null,
        });
      },

      cycleHint() {
        const { present, hintIndex, hintVisible } = get();
        if (!present || isWon(present)) {
          return;
        }
        const moves: Move[] = enumerateLegalMoves(present);
        if (moves.length === 0) {
          return;
        }
        const nextIndex = hintVisible ? (hintIndex + 1) % moves.length : 0;
        set({
          hintIndex: nextIndex,
          hintVisible: true,
          hintPulseKey: Date.now(),
        });
      },

      clearHint() {
        const { hintVisible } = get();
        if (!hintVisible) {
          return;
        }
        set({ hintVisible: false, hintIndex: 0 });
      },

      openDialog(name) {
        const { openDialogs } = get();
        if (openDialogs.includes(name)) {
          return;
        }
        set({ openDialogs: [...openDialogs, name] });
      },

      closeDialog(name) {
        const { openDialogs } = get();
        set({ openDialogs: openDialogs.filter((n) => n !== name) });
      },

      isDialogOpen(name) {
        return get().openDialogs.includes(name);
      },

      registerAbandonAsLoss() {
        const { present, stats } = get();
        if (!present || isWon(present) || present.moves === 0) {
          return;
        }
        set({ stats: recordLoss(stats, present.difficulty) });
      },

      updateSettings(patch) {
        const prev = get().settings;
        const next = { ...prev, ...patch };
        if (patch.sounds && patch.sounds !== prev.sounds) {
          applySoundsSetting(patch.sounds);
        }
        set({ settings: next });
      },

      resetStats() {
        set({ stats: emptyStats() });
      },

      setInvalidFlash(column) {
        set({ invalidFlashColumn: column });
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
      name: "spider-solitaire@1",
      version: 2,
      partialize: (state) => ({
        present: state.present,
        past: state.past,
        settings: state.settings,
        stats: state.stats,
      }),
      migrate: (persisted, version) => {
        const state = persisted as { settings?: Settings } | undefined;
        if (state?.settings && version < 2) {
          const legacy = state.settings.cardBack as CardBackId | "red" | "blue";
          if (legacy === "red") {
            state.settings.cardBack = "crimson";
          } else if (legacy === "blue") {
            state.settings.cardBack = "ocean";
          }
        }
        return state as unknown;
      },
      onRehydrateStorage: () => (state) => {
        if (state) {
          applySoundsSetting(state.settings.sounds);
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
  return (
    state.past.length > 0 && state.present !== null && !isWon(state.present)
  );
}

export function selectCanDeal(state: GameStore): boolean {
  const present = state.present;
  if (!present || isWon(present)) {
    return false;
  }
  return canDeal(present);
}

export function selectAnyDialogOpen(state: GameStore): boolean {
  return state.openDialogs.length > 0;
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

export function selectCardFront(state: GameStore): CardFrontId {
  return state.settings.cardFront;
}

export function selectCardBack(state: GameStore): CardBackId {
  return state.settings.cardBack;
}

export const HINT_IDLE_MS = 30_000;

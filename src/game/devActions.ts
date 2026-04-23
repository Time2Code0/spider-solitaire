import { cloneState, FULL_SUIT_LENGTH, TABLEAU_COLUMNS } from "./engine";
import { playSound } from "./sounds";
import { useStatsStore } from "./statsStore";
import { pushHistory, useGameStore } from "./store";
import type { Card, GameState, LeaderboardEntry, Suit } from "./types";
import { SUITS } from "./types";

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

function recordWinFor(state: GameState): void {
  const entry: LeaderboardEntry = {
    moves: state.moves,
    elapsedMs: state.elapsedMs,
    finishedAt: state.completedAt ?? Date.now(),
  };
  useStatsStore.getState().recordWin(state.difficulty, entry);
}

/**
 * Dev-only: force the current game into a winning state so win animations
 * and dialogs can be exercised without playing through.
 */
export function devForceWin(): void {
  const { present, past, moveSeq } = useGameStore.getState();
  if (!present || present.completedAt !== null) {
    return;
  }
  const winning = buildWinningState(present);
  recordWinFor(winning);
  playSound("foundation");
  playSound("win");
  useGameStore.setState({
    present: winning,
    past: pushHistory(past, present),
    moveSeq: moveSeq + 1,
  });
}

/**
 * Dev-only: mark the current game as lost (dead-end) so the lose dialog and
 * loss-recording flow can be exercised without playing into a stuck state.
 */
export function devForceLose(): void {
  const { present, past, moveSeq } = useGameStore.getState();
  if (!present || present.completedAt !== null) {
    return;
  }
  const lost: GameState = {
    ...cloneState(present),
    completedAt: Date.now(),
  };
  playSound("invalid");
  useGameStore.setState({
    present: lost,
    past: pushHistory(past, present),
    moveSeq: moveSeq + 1,
  });
}

import {
  canDeal,
  canPlaceOn,
  deepestMovableIndex,
  isMovableGroup,
  topFaceUpIndex,
} from "./engine";
import type { Card, GameState, Move } from "./types";

interface RankedMove {
  move: Move;
  score: number;
}

function scoreMove(
  state: GameState,
  from: number,
  cardIndex: number,
  to: number,
  run: readonly Card[]
): number {
  const source = state.tableau[from] as Card[];
  const target = state.tableau[to] as Card[];
  const topUpIndex = topFaceUpIndex(source);
  const revealsFaceDown = cardIndex > 0 && cardIndex === topUpIndex;
  const emptiesColumn = cardIndex === 0;
  const targetBottom = target.length > 0 ? (target.at(-1) as Card) : null;
  const extendsSuit =
    targetBottom !== null && targetBottom.suit === (run[0] as Card).suit;
  const runLength = run.length;

  let score = 0;
  if (revealsFaceDown) {
    score += 1000 + runLength * 2;
  }
  if (emptiesColumn && !revealsFaceDown) {
    score += 400 + runLength * 2;
  }
  if (extendsSuit) {
    score += 300 + runLength * 4;
  }
  if (target.length === 0 && !emptiesColumn) {
    score -= 200;
  }
  score += runLength;
  return score;
}

function collectMovesFromRun(
  state: GameState,
  from: number,
  cardIndex: number,
  run: readonly Card[],
  into: RankedMove[]
): void {
  const tableau = state.tableau;
  for (let to = 0; to < tableau.length; to++) {
    if (to === from) {
      continue;
    }
    const target = tableau[to] as Card[];
    if (!canPlaceOn(run, target)) {
      continue;
    }
    if (target.length === 0 && cardIndex === 0) {
      continue;
    }
    into.push({
      move: { kind: "tableau", from, cardIndex, to },
      score: scoreMove(state, from, cardIndex, to, run),
    });
  }
}

function collectMovesFromColumn(
  state: GameState,
  from: number,
  into: RankedMove[]
): void {
  const source = state.tableau[from] as Card[];
  if (source.length === 0) {
    return;
  }
  const topUp = topFaceUpIndex(source);
  const deepest = deepestMovableIndex(source);
  for (let cardIndex = deepest; cardIndex < source.length; cardIndex++) {
    if (cardIndex < topUp) {
      continue;
    }
    const run = source.slice(cardIndex);
    if (!isMovableGroup(run)) {
      continue;
    }
    collectMovesFromRun(state, from, cardIndex, run, into);
  }
}

export function enumerateLegalMoves(state: GameState): Move[] {
  const ranked: RankedMove[] = [];
  for (let from = 0; from < state.tableau.length; from++) {
    collectMovesFromColumn(state, from, ranked);
  }
  ranked.sort((a, b) => b.score - a.score);
  const moves = ranked.map((r) => r.move);
  if (canDeal(state)) {
    moves.push({ kind: "deal" });
  }
  return moves;
}

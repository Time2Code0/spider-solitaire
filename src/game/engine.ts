import { hashSeed, mulberry32, randomSeed, shuffle } from "./rng";
import type { Card, Difficulty, GameState, Suit } from "./types";
import { RANKS } from "./types";

const TABLEAU_COLUMNS = 10;
const STOCK_DEALS = 5;
const INITIAL_DEAL = 54;
const TOTAL_FOUNDATIONS = 8;
const FULL_SUIT_LENGTH = 13;

function suitsForDifficulty(difficulty: Difficulty): Suit[] {
  switch (difficulty) {
    case 1:
      return ["S"];
    case 2:
      return ["S", "H"];
    case 4:
      return ["S", "H", "D", "C"];
    default:
      return ["S", "H", "D", "C"];
  }
}

export function buildDeck(difficulty: Difficulty, rng: () => number): Card[] {
  const suits = suitsForDifficulty(difficulty);
  const copies = 8 / suits.length;
  const cards: Card[] = [];
  for (let copy = 0; copy < copies; copy++) {
    for (const suit of suits) {
      for (const rank of RANKS) {
        const idRand = Math.floor(rng() * 0xff_ff_ff_ff);
        cards.push({
          id: `${suit}${rank}-${copy}-${idRand.toString(36)}`,
          suit,
          rank,
          faceUp: false,
        });
      }
    }
  }
  return cards;
}

export function createInitialState(
  difficulty: Difficulty,
  seed: string = randomSeed()
): GameState {
  const rng = mulberry32(hashSeed(seed));
  const deck = shuffle(buildDeck(difficulty, rng), rng);

  const tableau: Card[][] = Array.from({ length: TABLEAU_COLUMNS }, () => []);
  let cursor = 0;
  for (let i = 0; i < INITIAL_DEAL; i++) {
    const column = i % TABLEAU_COLUMNS;
    const card = deck[cursor] as Card;
    cursor++;
    tableau[column]?.push(card);
  }
  for (const column of tableau) {
    const last = column.at(-1);
    if (last) {
      last.faceUp = true;
    }
  }

  const stock: Card[][] = [];
  for (let deal = 0; deal < STOCK_DEALS; deal++) {
    const slice = deck.slice(cursor, cursor + TABLEAU_COLUMNS);
    cursor += TABLEAU_COLUMNS;
    stock.push(slice);
  }

  return {
    difficulty,
    tableau,
    stock,
    foundations: [],
    moves: 0,
    elapsedMs: 0,
    startedAt: Date.now(),
    seed,
    undosUsed: 0,
    completedAt: null,
  };
}

export function cloneState(state: GameState): GameState {
  return {
    ...state,
    tableau: state.tableau.map((col) => col.map((c) => ({ ...c }))),
    stock: state.stock.map((deal) => deal.map((c) => ({ ...c }))),
    foundations: state.foundations.map((f) => f.map((c) => ({ ...c }))),
  };
}

export function isDescending(cards: readonly Card[]): boolean {
  if (cards.length <= 1) {
    return true;
  }
  for (let i = 0; i < cards.length - 1; i++) {
    const a = cards[i] as Card;
    const b = cards[i + 1] as Card;
    if (a.rank - 1 !== b.rank) {
      return false;
    }
  }
  return true;
}

export function isSameSuitRun(cards: readonly Card[]): boolean {
  if (cards.length <= 1) {
    return true;
  }
  const first = cards[0] as Card;
  for (let i = 1; i < cards.length; i++) {
    if ((cards[i] as Card).suit !== first.suit) {
      return false;
    }
  }
  return isDescending(cards);
}

export function isMovableGroup(cards: readonly Card[]): boolean {
  if (cards.length === 0) {
    return false;
  }
  for (const card of cards) {
    if (!card.faceUp) {
      return false;
    }
  }
  return isSameSuitRun(cards);
}

export function canPlaceOn(
  moving: readonly Card[],
  targetColumn: readonly Card[]
): boolean {
  if (moving.length === 0) {
    return false;
  }
  const top = moving[0] as Card;
  if (targetColumn.length === 0) {
    return true;
  }
  const bottom = targetColumn.at(-1) as Card;
  if (!bottom.faceUp) {
    return false;
  }
  return bottom.rank - 1 === top.rank;
}

export function attemptTableauMove(
  state: GameState,
  from: number,
  cardIndex: number,
  to: number
): GameState | null {
  if (from === to) {
    return null;
  }
  const source = state.tableau[from];
  const target = state.tableau[to];
  if (!(source && target)) {
    return null;
  }
  if (cardIndex < 0 || cardIndex >= source.length) {
    return null;
  }
  const moving = source.slice(cardIndex);
  if (!isMovableGroup(moving)) {
    return null;
  }
  if (!canPlaceOn(moving, target)) {
    return null;
  }
  const next = cloneState(state);
  const newSource = next.tableau[from] as Card[];
  const newTarget = next.tableau[to] as Card[];
  const taken = newSource.splice(cardIndex);
  for (const card of taken) {
    newTarget.push(card);
  }
  if (newSource.length > 0) {
    const top = newSource.at(-1) as Card;
    top.faceUp = true;
  }
  next.moves += 1;
  return applyAutoFoundation(next);
}

export function canDeal(state: GameState): boolean {
  if (state.stock.length === 0) {
    return false;
  }
  for (const column of state.tableau) {
    if (column.length === 0) {
      return false;
    }
  }
  return true;
}

export function applyDeal(state: GameState): GameState | null {
  if (!canDeal(state)) {
    return null;
  }
  const next = cloneState(state);
  const deal = next.stock.shift();
  if (!deal) {
    return null;
  }
  for (let i = 0; i < TABLEAU_COLUMNS; i++) {
    const card = deal[i];
    if (!card) {
      continue;
    }
    card.faceUp = true;
    (next.tableau[i] as Card[]).push(card);
  }
  next.moves += 1;
  return applyAutoFoundation(next);
}

function findFullSuitColumn(state: GameState): number {
  for (let col = 0; col < state.tableau.length; col++) {
    const column = state.tableau[col] as Card[];
    if (column.length < FULL_SUIT_LENGTH) {
      continue;
    }
    const tail = column.slice(column.length - FULL_SUIT_LENGTH);
    if (!isMovableGroup(tail)) {
      continue;
    }
    const top = tail[0] as Card;
    const bottom = tail.at(-1) as Card;
    if (top.rank === 13 && bottom.rank === 1) {
      return col;
    }
  }
  return -1;
}

export function applyAutoFoundation(state: GameState): GameState {
  let next = state;
  let target = findFullSuitColumn(next);
  while (target !== -1) {
    next = cloneState(next);
    const column = next.tableau[target] as Card[];
    const suitRun = column.splice(
      column.length - FULL_SUIT_LENGTH,
      FULL_SUIT_LENGTH
    );
    next.foundations.push(suitRun);
    const newTop = column.at(-1);
    if (newTop) {
      newTop.faceUp = true;
    }
    target = findFullSuitColumn(next);
  }
  if (next === state) {
    return state;
  }
  if (isWon(next)) {
    next.completedAt = Date.now();
  }
  return next;
}

export function isWon(state: GameState): boolean {
  return state.foundations.length === TOTAL_FOUNDATIONS;
}

function hasMoveFromRun(
  tableau: readonly Card[][],
  from: number,
  run: readonly Card[],
  cardIndex: number
): boolean {
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
    return true;
  }
  return false;
}

export function hasAnyLegalMove(state: GameState): boolean {
  if (canDeal(state)) {
    return true;
  }
  const tableau = state.tableau;
  for (let from = 0; from < tableau.length; from++) {
    const source = tableau[from] as Card[];
    for (let i = source.length - 1; i >= 0; i--) {
      const card = source[i] as Card;
      if (!card.faceUp) {
        break;
      }
      const run = source.slice(i);
      if (!isMovableGroup(run)) {
        break;
      }
      if (hasMoveFromRun(tableau, from, run, i)) {
        return true;
      }
    }
  }
  return false;
}

export function topFaceUpIndex(column: readonly Card[]): number {
  for (let i = 0; i < column.length; i++) {
    if ((column[i] as Card).faceUp) {
      return i;
    }
  }
  return column.length;
}

export function deepestMovableIndex(column: readonly Card[]): number {
  const firstUp = topFaceUpIndex(column);
  if (firstUp >= column.length) {
    return column.length;
  }
  let deepest = column.length - 1;
  for (let i = column.length - 2; i >= firstUp; i--) {
    const a = column[i] as Card;
    const b = column[i + 1] as Card;
    if (a.suit === b.suit && a.rank - 1 === b.rank) {
      deepest = i;
    } else {
      break;
    }
  }
  return deepest;
}

export {
  FULL_SUIT_LENGTH,
  INITIAL_DEAL,
  STOCK_DEALS,
  TABLEAU_COLUMNS,
  TOTAL_FOUNDATIONS,
};

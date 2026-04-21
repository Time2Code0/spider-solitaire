export const SUITS = ["S", "H", "D", "C"] as const;
export type Suit = (typeof SUITS)[number];

export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export const RANKS: readonly Rank[] = [
  1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13,
];

export interface Card {
  faceUp: boolean;
  id: string;
  rank: Rank;
  suit: Suit;
}

export type Difficulty = 1 | 2 | 4;

export type Move =
  | {
      kind: "tableau";
      from: number;
      cardIndex: number;
      to: number;
    }
  | {
      kind: "deal";
    }
  | {
      kind: "foundation";
      from: number;
    };

export interface GameState {
  completedAt: number | null;
  difficulty: Difficulty;
  elapsedMs: number;
  foundations: Card[][];
  moves: number;
  seed: string;
  startedAt: number;
  stock: Card[][];
  tableau: Card[][];
  undosUsed: number;
}

export type CardFrontId = "classic" | "vintage" | "modern";
export type CardBackId =
  | "crimson"
  | "ocean"
  | "forest"
  | "rosewood"
  | "midnight"
  | "royal";
export type SoundsMode = "on" | "off";

export type BackgroundColor = "green" | "red" | "blue";
export type BackgroundStyle = "modern" | "vintage" | "classic";

export interface Background {
  color: BackgroundColor;
  style: BackgroundStyle;
}

export interface Settings {
  background: Background;
  cardBack: CardBackId;
  cardFront: CardFrontId;
  confirmNewGame: boolean;
  defaultDifficulty: Difficulty;
  sounds: SoundsMode;
}

export interface LeaderboardEntry {
  elapsedMs: number;
  finishedAt: number;
  moves: number;
}

export interface DifficultyStats {
  leaderboard: LeaderboardEntry[];
  played: number;
  totalWinElapsedMs: number;
  totalWinMoves: number;
  won: number;
}

export type StatsByDifficulty = Record<Difficulty, DifficultyStats>;

export const SUIT_NAMES: Record<Suit, string> = {
  S: "spade",
  H: "heart",
  D: "diamond",
  C: "club",
};

export const RANK_CODES: Record<Rank, string> = {
  1: "A",
  2: "2",
  3: "3",
  4: "4",
  5: "5",
  6: "6",
  7: "7",
  8: "8",
  9: "9",
  10: "10",
  11: "J",
  12: "Q",
  13: "K",
};

export const RANK_LABELS: Record<Rank, string> = {
  1: "Ace",
  2: "Two",
  3: "Three",
  4: "Four",
  5: "Five",
  6: "Six",
  7: "Seven",
  8: "Eight",
  9: "Nine",
  10: "Ten",
  11: "Jack",
  12: "Queen",
  13: "King",
};

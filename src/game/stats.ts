import type {
  Difficulty,
  DifficultyStats,
  LeaderboardEntry,
  StatsByDifficulty,
} from "./types";

const LEADERBOARD_MAX = 10;

export function emptyDifficultyStats(): DifficultyStats {
  return {
    played: 0,
    won: 0,
    totalWinMoves: 0,
    totalWinElapsedMs: 0,
    leaderboard: [],
  };
}

export function emptyStats(): StatsByDifficulty {
  return {
    1: emptyDifficultyStats(),
    2: emptyDifficultyStats(),
    4: emptyDifficultyStats(),
  };
}

export function recordWin(
  stats: StatsByDifficulty,
  difficulty: Difficulty,
  entry: LeaderboardEntry
): StatsByDifficulty {
  const current = stats[difficulty];
  const nextLeaderboard = [...current.leaderboard, entry]
    .sort((a, b) => {
      if (a.moves !== b.moves) {
        return a.moves - b.moves;
      }
      if (a.elapsedMs !== b.elapsedMs) {
        return a.elapsedMs - b.elapsedMs;
      }
      return a.finishedAt - b.finishedAt;
    })
    .slice(0, LEADERBOARD_MAX);
  return {
    ...stats,
    [difficulty]: {
      played: current.played + 1,
      won: current.won + 1,
      totalWinMoves: current.totalWinMoves + entry.moves,
      totalWinElapsedMs: current.totalWinElapsedMs + entry.elapsedMs,
      leaderboard: nextLeaderboard,
    },
  };
}

export function recordLoss(
  stats: StatsByDifficulty,
  difficulty: Difficulty
): StatsByDifficulty {
  const current = stats[difficulty];
  return {
    ...stats,
    [difficulty]: {
      ...current,
      played: current.played + 1,
    },
  };
}

export function winRate(stats: DifficultyStats): number {
  if (stats.played === 0) {
    return 0;
  }
  return stats.won / stats.played;
}

export function averageWinMoves(stats: DifficultyStats): number {
  if (stats.won === 0) {
    return 0;
  }
  return stats.totalWinMoves / stats.won;
}

export function averageWinElapsedMs(stats: DifficultyStats): number {
  if (stats.won === 0) {
    return 0;
  }
  return stats.totalWinElapsedMs / stats.won;
}

export function isNewBest(
  stats: DifficultyStats,
  entry: LeaderboardEntry
): boolean {
  const first = stats.leaderboard[0];
  if (!first) {
    return true;
  }
  if (entry.moves < first.moves) {
    return true;
  }
  if (entry.moves === first.moves && entry.elapsedMs < first.elapsedMs) {
    return true;
  }
  return false;
}

export { LEADERBOARD_MAX };

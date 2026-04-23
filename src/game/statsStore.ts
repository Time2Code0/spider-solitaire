import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  emptyStats,
  recordLoss as recordLossPure,
  recordWin as recordWinPure,
} from "./stats";
import type { Difficulty, LeaderboardEntry, StatsByDifficulty } from "./types";

const STATS_STORE_KEY = "spider-solitaire/stats@1";
const LEGACY_STORE_KEY = "spider-solitaire@1";

export interface StatsStore {
  hasHydrated: boolean;
  markHydrated: () => void;
  recordLoss: (difficulty: Difficulty) => void;
  recordWin: (difficulty: Difficulty, entry: LeaderboardEntry) => void;
  resetStats: () => void;
  stats: StatsByDifficulty;
}

// Seeds the new stats key from the legacy `spider-solitaire@1` bundle on
// first load so existing installs keep their win history. Runs once at
// module import, before persist middleware reads the new key. Safe to remove
// after one release cycle.
function seedFromLegacyKey(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (window.localStorage.getItem(STATS_STORE_KEY)) {
      return;
    }
    const legacyRaw = window.localStorage.getItem(LEGACY_STORE_KEY);
    if (!legacyRaw) {
      return;
    }
    const parsed = JSON.parse(legacyRaw) as {
      state?: { stats?: StatsByDifficulty };
    };
    const legacyStats = parsed.state?.stats;
    if (!legacyStats) {
      return;
    }
    window.localStorage.setItem(
      STATS_STORE_KEY,
      JSON.stringify({
        state: { stats: legacyStats },
        version: 1,
      })
    );
  } catch {
    // Ignore parse errors; the store will fall back to empty stats.
  }
}

seedFromLegacyKey();

export const useStatsStore = create<StatsStore>()(
  persist(
    (set, get) => ({
      stats: emptyStats(),
      hasHydrated: false,

      recordWin(difficulty, entry) {
        set({ stats: recordWinPure(get().stats, difficulty, entry) });
      },

      recordLoss(difficulty) {
        set({ stats: recordLossPure(get().stats, difficulty) });
      },

      resetStats() {
        set({ stats: emptyStats() });
      },

      markHydrated() {
        set({ hasHydrated: true });
      },
    }),
    {
      name: STATS_STORE_KEY,
      version: 1,
      partialize: (state) => ({ stats: state.stats }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.markHydrated();
        }
      },
    }
  )
);

export function selectStats(state: StatsStore): StatsByDifficulty {
  return state.stats;
}

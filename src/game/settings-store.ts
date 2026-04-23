import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setSoundsEnabled } from "./sounds";
import type { CardBackId, Settings, SoundsMode } from "./types";

const SETTINGS_STORE_KEY = "spider-solitaire/settings@1";
const LEGACY_STORE_KEY = "spider-solitaire@1";

export const defaultSettings: Settings = {
  defaultDifficulty: 4,
  cardFront: "classic",
  cardBack: "crimson",
  sounds: "off",
  confirmNewGame: true,
  background: { color: "green", style: "modern" },
};

export interface SettingsStore {
  hasHydrated: boolean;
  markHydrated: () => void;
  settings: Settings;
  updateSettings: (patch: Partial<Settings>) => void;
}

function applySoundsSetting(mode: SoundsMode): void {
  setSoundsEnabled(mode === "on");
}

// Seeds the new settings key from the legacy `spider-solitaire@1` bundle on
// first load so existing installs keep their preferences. Runs once at module
// import, before persist middleware reads the new key. Safe to remove after
// one release cycle.
function seedFromLegacyKey(): void {
  if (typeof window === "undefined") {
    return;
  }
  try {
    if (window.localStorage.getItem(SETTINGS_STORE_KEY)) {
      return;
    }
    const legacyRaw = window.localStorage.getItem(LEGACY_STORE_KEY);
    if (!legacyRaw) {
      return;
    }
    const parsed = JSON.parse(legacyRaw) as {
      state?: { settings?: Partial<Settings> };
    };
    const legacySettings = parsed.state?.settings;
    if (!legacySettings) {
      return;
    }
    window.localStorage.setItem(
      SETTINGS_STORE_KEY,
      JSON.stringify({
        state: { settings: { ...defaultSettings, ...legacySettings } },
        version: 4,
      })
    );
  } catch {
    // Ignore parse errors; the store will fall back to defaults.
  }
}

seedFromLegacyKey();

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      settings: defaultSettings,
      hasHydrated: false,

      updateSettings(patch) {
        const prev = get().settings;
        const next = { ...prev, ...patch };
        if (patch.sounds && patch.sounds !== prev.sounds) {
          applySoundsSetting(patch.sounds);
        }
        set({ settings: next });
      },

      markHydrated() {
        set({ hasHydrated: true });
      },
    }),
    {
      name: SETTINGS_STORE_KEY,
      version: 4,
      partialize: (state) => ({ settings: state.settings }),
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
        if (state?.settings && version < 3) {
          const legacy = state.settings.cardBack as CardBackId | "slate";
          if (legacy === "slate") {
            state.settings.cardBack = "royal";
          }
        }
        if (state?.settings && version < 4) {
          state.settings.background = defaultSettings.background;
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

export function selectCardFront(state: SettingsStore) {
  return state.settings.cardFront;
}

export function selectCardBack(state: SettingsStore) {
  return state.settings.cardBack;
}

"use client";

import { HotkeysProvider, useHotkey } from "@tanstack/react-hotkeys";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoseDialog } from "@/components/dialogs/lose-dialog";
import { WinDialog } from "@/components/dialogs/win-dialog";
import { devForceLose, devForceWin } from "@/game/dev-actions";
import { isMovableGroup } from "@/game/engine";
import { enumerateLegalMoves } from "@/game/hints";
import { HINT_IDLE_MS, useHintsStore } from "@/game/hints-store";
import { selectIsPaused, usePauseStore } from "@/game/pause-store";
import { useSettingsStore } from "@/game/settings-store";
import {
  selectCanDeal,
  selectCanUndo,
  selectCurrentGame,
  useGameStore,
} from "@/game/game-store";
import type { GameState, Move } from "@/game/types";
import { Board } from "./board";
import { BottomBar } from "./bottom-bar";
import { DEAL_ANIMATION_TOTAL_MS } from "./deal-animation";
import {
  type ActiveDrag,
  type DragContextValue,
  DragProvider,
} from "./drag-context";
import { Foundations } from "./foundations";
import { Stock } from "./stock";
import { useTimer } from "./use-timer";
import { WinFlourish } from "./win-flourish";

const IS_DEV = process.env.NODE_ENV === "development";

export function GameShell() {
  return (
    <HotkeysProvider>
      <InnerShell />
    </HotkeysProvider>
  );
}

function InnerShell() {
  const present = useGameStore(selectCurrentGame);
  const settings = useSettingsStore((s) => s.settings);
  const settingsHydrated = useSettingsStore((s) => s.hasHydrated);
  const gameHydrated = useGameStore((s) => s.hasHydrated);
  const hasHydrated = gameHydrated && settingsHydrated;
  const startNewGame = useGameStore((s) => s.startNewGame);
  const attemptMoveAction = useGameStore((s) => s.attemptMove);
  const deal = useGameStore((s) => s.deal);
  const undo = useGameStore((s) => s.undo);
  const cycleHint = useHintsStore((s) => s.cycleHint);
  const clearHint = useHintsStore((s) => s.clearHint);
  const hintVisible = useHintsStore((s) => s.hintVisible);
  const hintIndex = useHintsStore((s) => s.hintIndex);
  const hintPulseKey = useHintsStore((s) => s.hintPulseKey);
  const canUndo = useGameStore(selectCanUndo);
  const canDeal = useGameStore(selectCanDeal);
  const isPaused = usePauseStore(selectIsPaused);
  const lastMoveAt = useHintsStore((s) => s.lastMoveAt);

  useTimer();

  const [invalidFlashColumn, setInvalidFlashColumn] = useState<number | null>(
    null
  );

  const attemptMove = useCallback(
    (from: number, cardIndex: number, to: number): boolean => {
      const result = attemptMoveAction(from, cardIndex, to);
      if (!result.ok && result.reason === "invalid") {
        setInvalidFlashColumn(result.column);
      }
      return result.ok;
    },
    [attemptMoveAction]
  );

  useEffect(() => {
    if (hasHydrated && !present) {
      startNewGame(settings.defaultDifficulty);
    }
  }, [hasHydrated, present, settings.defaultDifficulty, startNewGame]);

  useEffect(() => {
    if (invalidFlashColumn === null) {
      return;
    }
    const t = window.setTimeout(() => setInvalidFlashColumn(null), 380);
    return () => window.clearTimeout(t);
  }, [invalidFlashColumn]);

  useEffect(() => {
    if (!present || isPaused) {
      return;
    }
    const t = window.setTimeout(() => {
      const now = Date.now();
      if (now - lastMoveAt >= HINT_IDLE_MS) {
        cycleHint();
      }
    }, HINT_IDLE_MS + 20);
    return () => window.clearTimeout(t);
  }, [present, lastMoveAt, isPaused, cycleHint]);

  useHotkey("Mod+Z", () => undo(), { enabled: canUndo && !isPaused });
  useHotkey("H", () => cycleHint(), { enabled: !isPaused });
  useHotkey("Space", () => runDeal(), { enabled: canDeal && !isPaused });
  useHotkey("Shift+W", () => devForceWin(), {
    enabled: IS_DEV && !!present && !isPaused,
  });
  useHotkey("Shift+L", () => devForceLose(), {
    enabled: IS_DEV && !!present && !isPaused,
  });

  const [selection, setSelection] = useState<{
    columnIndex: number;
    cardIndex: number;
  } | null>(null);

  const [activeDrag, setActiveDrag] = useState<ActiveDrag | null>(null);

  // Container used to carry the `--drag-x` / `--drag-y` CSS variables so the
  // follower cards in the active drag stack can mirror the leader's Motion
  // transform without triggering React re-renders per pointer frame.
  const dragContainerRef = useRef<HTMLDivElement>(null);

  // IDs of cards currently running the "fly from stock → flip face-up"
  // animation. Populated from stock[0] immediately before a successful deal,
  // cleared after the full staggered sequence finishes. Card components that
  // see their id in this set render the dealing branch (3D flip wrapper).
  const [dealingIds, setDealingIds] = useState<ReadonlySet<string>>(
    () => new Set()
  );
  const dealingTimeoutRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (dealingTimeoutRef.current !== null) {
        window.clearTimeout(dealingTimeoutRef.current);
      }
    },
    []
  );

  const runDeal = useCallback(() => {
    // Snapshot the next pile's ids BEFORE dispatching, since `deal()` shifts
    // stock[0] off. These are exactly the cards that will fly into columns
    // 0..9 and need isDealing=true in their new position.
    const present = useGameStore.getState().present;
    const pending = present?.stock[0]?.map((c) => c.id) ?? [];
    const ok = deal();
    if (!ok || pending.length === 0) {
      return;
    }
    setDealingIds((prev) => {
      const next = new Set(prev);
      for (const id of pending) {
        next.add(id);
      }
      return next;
    });
    if (dealingTimeoutRef.current !== null) {
      window.clearTimeout(dealingTimeoutRef.current);
    }
    dealingTimeoutRef.current = window.setTimeout(() => {
      setDealingIds((prev) => {
        if (prev.size === 0) {
          return prev;
        }
        const next = new Set(prev);
        for (const id of pending) {
          next.delete(id);
        }
        return next;
      });
      dealingTimeoutRef.current = null;
    }, DEAL_ANIMATION_TOTAL_MS + 80);
  }, [deal]);

  useEffect(() => {
    setSelection(null);
  }, []);

  const { hintedCardIds, hintedEmptyColumns } = useMemo(
    () => computeHintTargets(present, hintVisible, hintIndex),
    [present, hintVisible, hintIndex]
  );

  const stockHintPulse = useMemo(
    () => computeHintOnStock(present, hintVisible, hintIndex),
    [present, hintVisible, hintIndex]
  );

  const handleSetActiveDrag = useCallback(
    (drag: ActiveDrag | null) => {
      if (drag) {
        clearHint();
      }
      setActiveDrag(drag);
    },
    [clearHint]
  );

  const dragContextValue = useMemo<DragContextValue>(
    () => ({
      activeDrag,
      attemptMove,
      containerRef: dragContainerRef,
      setActiveDrag: handleSetActiveDrag,
    }),
    [activeDrag, attemptMove, handleSetActiveDrag]
  );

  const onSelect = useCallback(
    (columnIndex: number, cardIndex: number) => {
      if (selection) {
        if (
          selection.columnIndex === columnIndex &&
          selection.cardIndex === cardIndex
        ) {
          setSelection(null);
          return;
        }
        attemptMove(selection.columnIndex, selection.cardIndex, columnIndex);
        setSelection(null);
        return;
      }
      const column = present?.tableau[columnIndex];
      if (!column) {
        return;
      }
      const card = column[cardIndex];
      if (!card?.faceUp) {
        return;
      }
      if (!isMovableGroup(column.slice(cardIndex))) {
        return;
      }
      setSelection({ columnIndex, cardIndex });
    },
    [selection, attemptMove, present]
  );

  const onTargetClick = useCallback(
    (columnIndex: number) => {
      if (!selection) {
        return;
      }
      attemptMove(selection.columnIndex, selection.cardIndex, columnIndex);
      setSelection(null);
    },
    [selection, attemptMove]
  );

  useEffect(() => {
    if (!selection) {
      return;
    }
    const handlePointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.closest('[data-card-id], button, [role="button"], a, input')
      ) {
        return;
      }
      setSelection(null);
    };
    document.addEventListener("mousedown", handlePointerDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [selection]);

  if (!hasHydrated) {
    return <div className="felt-backdrop flex min-h-screen" />;
  }

  return (
    <DragProvider value={dragContextValue}>
      <main
        className="felt-backdrop flex min-h-screen flex-col pb-(--bottom-bar-h)"
        data-bg-color={settings.background.color}
        data-bg-style={settings.background.style}
        ref={dragContainerRef}
      >
        <div className="flex-1 px-8 py-6">
          {present ? (
            <Board
              activeDrag={activeDrag}
              back={settings.cardBack}
              dealingIds={dealingIds}
              front={settings.cardFront}
              hintedCardIds={hintedCardIds}
              hintedEmptyColumns={hintedEmptyColumns}
              hintPulseKey={hintPulseKey}
              invalidFlashColumn={invalidFlashColumn}
              onSelect={onSelect}
              onTargetClick={onTargetClick}
              selection={selection}
              tableau={present.tableau}
            />
          ) : null}
        </div>

        <div className="pointer-events-none fixed right-8 bottom-[calc(var(--bottom-bar-h)+20px)] left-8 z-30 flex items-end justify-between gap-6 *:pointer-events-auto">
          {present ? (
            <Foundations
              foundations={present.foundations}
              front={settings.cardFront}
            />
          ) : (
            <div />
          )}
          {present ? (
            <Stock
              back={settings.cardBack}
              canDeal={canDeal}
              front={settings.cardFront}
              hintPulse={stockHintPulse}
              hintPulseKey={hintPulseKey}
              onDeal={runDeal}
              stock={present.stock}
            />
          ) : null}
        </div>

        <BottomBar />

        <WinFlourish />
        <WinDialog />
        <LoseDialog />
      </main>
    </DragProvider>
  );
}

function computeHintTargets(
  present: GameState | null,
  hintVisible: boolean,
  hintIndex: number
): { hintedCardIds: Set<string>; hintedEmptyColumns: Set<number> } {
  const hintedCardIds = new Set<string>();
  const hintedEmptyColumns = new Set<number>();
  if (!(present && hintVisible)) {
    return { hintedCardIds, hintedEmptyColumns };
  }
  const moves = enumerateLegalMoves(present);
  const move = moves[hintIndex] as Move | undefined;
  if (!move || move.kind !== "tableau") {
    return { hintedCardIds, hintedEmptyColumns };
  }
  const source = present.tableau[move.from];
  if (!source) {
    return { hintedCardIds, hintedEmptyColumns };
  }
  for (let i = move.cardIndex; i < source.length; i++) {
    const id = source[i]?.id;
    if (id) {
      hintedCardIds.add(id);
    }
  }
  const target = present.tableau[move.to];
  if (target && target.length > 0) {
    const bottom = target.at(-1);
    if (bottom) {
      hintedCardIds.add(bottom.id);
    }
  } else {
    hintedEmptyColumns.add(move.to);
  }
  return { hintedCardIds, hintedEmptyColumns };
}

function computeHintOnStock(
  present: GameState | null,
  hintVisible: boolean,
  hintIndex: number
): boolean {
  if (!(present && hintVisible)) {
    return false;
  }
  const moves = enumerateLegalMoves(present);
  const move = moves[hintIndex] as Move | undefined;
  return move?.kind === "deal";
}

"use client";

import { HotkeysProvider, useHotkey } from "@tanstack/react-hotkeys";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ConfirmDialog } from "@/components/dialogs/ConfirmDialog";
import { EndOfGameDialog } from "@/components/dialogs/EndOfGameDialog";
import { SettingsDialog } from "@/components/dialogs/SettingsDialog";
import { StatsDialog } from "@/components/dialogs/StatsDialog";
import { isMovableGroup } from "@/game/engine";
import { enumerateLegalMoves } from "@/game/hints";
import {
  HINT_IDLE_MS,
  selectAnyDialogOpen,
  selectCanDeal,
  selectCanUndo,
  selectCurrentGame,
  useGameStore,
} from "@/game/store";
import type { GameState, Move } from "@/game/types";
import { Board } from "./Board";
import { BottomBar } from "./BottomBar";
import {
  type ActiveDrag,
  type DragContextValue,
  DragProvider,
} from "./DragContext";
import { Foundations } from "./Foundations";
import { Stock } from "./Stock";
import { useTimer } from "./useTimer";
import { WinFlourish } from "./WinFlourish";

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
  const settings = useGameStore((s) => s.settings);
  const hasHydrated = useGameStore((s) => s.hasHydrated);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const attemptMove = useGameStore((s) => s.attemptMove);
  const deal = useGameStore((s) => s.deal);
  const undo = useGameStore((s) => s.undo);
  const cycleHint = useGameStore((s) => s.cycleHint);
  const clearHint = useGameStore((s) => s.clearHint);
  const setInvalidFlash = useGameStore((s) => s.setInvalidFlash);
  const invalidFlashColumn = useGameStore((s) => s.invalidFlashColumn);
  const hintVisible = useGameStore((s) => s.hintVisible);
  const hintIndex = useGameStore((s) => s.hintIndex);
  const hintPulseKey = useGameStore((s) => s.hintPulseKey);
  const canUndo = useGameStore(selectCanUndo);
  const canDeal = useGameStore(selectCanDeal);
  const anyDialogOpen = useGameStore(selectAnyDialogOpen);
  const lastMoveAt = useGameStore((s) => s.lastMoveAt);
  const devForceWin = useGameStore((s) => s.devForceWin);
  const devForceLose = useGameStore((s) => s.devForceLose);

  useTimer();

  useEffect(() => {
    if (hasHydrated && !present) {
      startNewGame(settings.defaultDifficulty);
    }
  }, [hasHydrated, present, settings.defaultDifficulty, startNewGame]);

  useEffect(() => {
    if (invalidFlashColumn === null) {
      return;
    }
    const t = window.setTimeout(() => setInvalidFlash(null), 380);
    return () => window.clearTimeout(t);
  }, [invalidFlashColumn, setInvalidFlash]);

  useEffect(() => {
    if (!present || anyDialogOpen) {
      return;
    }
    const t = window.setTimeout(() => {
      const now = Date.now();
      if (now - lastMoveAt >= HINT_IDLE_MS) {
        cycleHint();
      }
    }, HINT_IDLE_MS + 20);
    return () => window.clearTimeout(t);
  }, [present, lastMoveAt, anyDialogOpen, cycleHint]);

  useHotkey("Mod+Z", () => undo(), { enabled: canUndo && !anyDialogOpen });
  useHotkey("H", () => cycleHint(), { enabled: !anyDialogOpen });
  useHotkey("Space", () => deal(), { enabled: canDeal && !anyDialogOpen });
  useHotkey("Shift+W", () => devForceWin(), {
    enabled: IS_DEV && !!present && !anyDialogOpen,
  });
  useHotkey("Shift+L", () => devForceLose(), {
    enabled: IS_DEV && !!present && !anyDialogOpen,
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
        ref={dragContainerRef}
      >
        <div className="flex-1 px-8 py-6">
          {present ? (
            <Board
              activeDrag={activeDrag}
              back={settings.cardBack}
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
              onDeal={deal}
              stock={present.stock}
            />
          ) : null}
        </div>

        <BottomBar />

        <WinFlourish />
        <SettingsDialog />
        <StatsDialog />
        <EndOfGameDialog />
        <ConfirmDialog />
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

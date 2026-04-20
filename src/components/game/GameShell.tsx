"use client";

import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { HotkeysProvider, useHotkey } from "@tanstack/react-hotkeys";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { DraggedStack } from "./DraggedStack";
import { Foundations } from "./Foundations";
import { Stock } from "./Stock";
import { useTimer } from "./useTimer";
import { WinFlourish } from "./WinFlourish";

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

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const [selection, setSelection] = useState<{
    columnIndex: number;
    cardIndex: number;
  } | null>(null);

  const [activeDrag, setActiveDrag] = useState<{
    columnIndex: number;
    cardIndex: number;
  } | null>(null);

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

  const onDragStart = useCallback(
    (event: DragStartEvent) => {
      clearHint();
      const data = event.active.data.current as
        | { columnIndex: number; cardIndex: number }
        | undefined;
      if (data) {
        setActiveDrag({
          columnIndex: data.columnIndex,
          cardIndex: data.cardIndex,
        });
      }
    },
    [clearHint]
  );

  const onDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDrag(null);
      const { active, over } = event;
      if (!over) {
        return;
      }
      const activeData = active.data.current as
        | { columnIndex: number; cardIndex: number }
        | undefined;
      const overData = over.data.current as { columnIndex: number } | undefined;
      if (!(activeData && overData)) {
        return;
      }
      if (activeData.columnIndex === overData.columnIndex) {
        return;
      }
      attemptMove(
        activeData.columnIndex,
        activeData.cardIndex,
        overData.columnIndex
      );
    },
    [attemptMove]
  );

  const onDragCancel = useCallback(() => {
    setActiveDrag(null);
  }, []);

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

  const draggedCards =
    activeDrag && present
      ? (present.tableau[activeDrag.columnIndex]?.slice(activeDrag.cardIndex) ??
        [])
      : [];

  return (
    <DndContext
      onDragCancel={onDragCancel}
      onDragEnd={onDragEnd}
      onDragStart={onDragStart}
      sensors={sensors}
    >
      <main className="felt-backdrop flex min-h-screen flex-col pb-[var(--bottom-bar-h)]">
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

        <div
          className="pointer-events-none fixed right-8 left-8 z-30 flex items-end justify-between gap-6 *:pointer-events-auto"
          style={{ bottom: "calc(var(--bottom-bar-h) + 20px)" }}
        >
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
      <DragOverlay dropAnimation={null}>
        {draggedCards.length > 0 ? (
          <DraggedStack
            back={settings.cardBack}
            cards={draggedCards}
            front={settings.cardFront}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
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

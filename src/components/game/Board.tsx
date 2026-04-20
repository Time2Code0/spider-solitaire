"use client";

import type { Card, CardBackId, CardFrontId } from "@/game/types";
import { Column } from "./Column";

export interface BoardProps {
  activeDrag: { columnIndex: number; cardIndex: number } | null;
  back: CardBackId;
  front: CardFrontId;
  hintedCardIds: Set<string>;
  hintedEmptyColumns: Set<number>;
  hintPulseKey: number;
  invalidFlashColumn: number | null;
  onSelect: (columnIndex: number, cardIndex: number) => void;
  onTargetClick: (columnIndex: number) => void;
  selection: { columnIndex: number; cardIndex: number } | null;
  tableau: Card[][];
}

export function Board(props: BoardProps) {
  const {
    activeDrag,
    tableau,
    front,
    back,
    selection,
    invalidFlashColumn,
    hintedCardIds,
    hintedEmptyColumns,
    hintPulseKey,
    onSelect,
    onTargetClick,
  } = props;

  return (
    <div
      className="mx-auto grid flex-1 grid-cols-10 justify-items-center"
      style={{
        gap: "var(--board-gap)",
        maxWidth: "calc(var(--card-w) * 10 + var(--board-gap) * 9 + 32px)",
      }}
    >
      {tableau.map((columnCards, columnIndex) => (
        <Column
          activeDrag={activeDrag}
          back={back}
          cards={columnCards}
          columnIndex={columnIndex}
          emptySlotHinted={hintedEmptyColumns.has(columnIndex)}
          front={front}
          hintedCardIds={hintedCardIds}
          hintPulseKey={hintPulseKey}
          invalidFlash={invalidFlashColumn === columnIndex}
          key={columnIndex}
          onSelect={onSelect}
          onTargetClick={onTargetClick}
          selection={selection}
        />
      ))}
    </div>
  );
}

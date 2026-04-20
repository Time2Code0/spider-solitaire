"use client";

import { useDroppable } from "@dnd-kit/core";
import { AnimatePresence } from "motion/react";
import { deepestMovableIndex } from "@/game/engine";
import type { CardBackId, CardFrontId, Card as CardModel } from "@/game/types";
import { Card } from "./Card";

const FANOUT_UP = 0.27;
const FANOUT_DOWN = 0.12;

export interface ColumnProps {
  activeDrag: { columnIndex: number; cardIndex: number } | null;
  back: CardBackId;
  cards: CardModel[];
  columnIndex: number;
  emptySlotHinted: boolean;
  front: CardFrontId;
  hintedCardIds: Set<string>;
  hintPulseKey: number;
  invalidFlash: boolean;
  onSelect: (columnIndex: number, cardIndex: number) => void;
  onTargetClick: (columnIndex: number) => void;
  selection: { columnIndex: number; cardIndex: number } | null;
}

export function Column(props: ColumnProps) {
  const {
    activeDrag,
    cards,
    columnIndex,
    emptySlotHinted,
    front,
    back,
    selection,
    invalidFlash,
    hintedCardIds,
    hintPulseKey,
    onSelect,
    onTargetClick,
  } = props;

  const { isOver, setNodeRef } = useDroppable({
    id: `column-${columnIndex}`,
    data: { columnIndex },
  });

  const deepest = deepestMovableIndex(cards);

  const offsets: number[] = [];
  let cursor = 0;
  for (const card of cards) {
    offsets.push(cursor);
    cursor += card.faceUp ? FANOUT_UP : FANOUT_DOWN;
  }

  const totalOffset = cursor;

  return (
    <section
      aria-label={`Column ${columnIndex + 1}, ${cards.length} cards`}
      className={[
        "relative select-none",
        invalidFlash ? "column-shake" : "",
        isOver ? "rounded-md outline-2 outline-[var(--color-gold)]/80" : "",
      ].join(" ")}
      ref={setNodeRef}
      style={{
        width: "var(--card-w)",
        minHeight: "var(--card-h)",
        height: `calc(var(--card-h) * (1 + ${totalOffset}))`,
      }}
    >
      <button
        aria-label={`Drop target for column ${columnIndex + 1}`}
        className={[
          "card-empty-slot absolute top-0 left-0 cursor-pointer",
          emptySlotHinted ? "pulse-hint" : "",
        ].join(" ")}
        key={emptySlotHinted ? `hint-${hintPulseKey}` : undefined}
        onClick={() => onTargetClick(columnIndex)}
        type="button"
      />
      <AnimatePresence initial={false}>
        {cards.map((card, cardIndex) => {
          const offset = offsets[cardIndex] ?? 0;
          const isSelected =
            selection !== null &&
            selection.columnIndex === columnIndex &&
            cardIndex >= selection.cardIndex;
          const isHinted = hintedCardIds.has(card.id);
          const isDraggable = card.faceUp && cardIndex >= deepest;
          const isPartOfActiveDrag = Boolean(
            activeDrag &&
              activeDrag.columnIndex === columnIndex &&
              cardIndex >= activeDrag.cardIndex
          );
          return (
            <div
              className="absolute left-0 w-full"
              key={card.id}
              style={{ top: `calc(var(--card-h) * ${offset})` }}
            >
              <Card
                back={back}
                card={card}
                cardIndex={cardIndex}
                columnIndex={columnIndex}
                draggable={isDraggable}
                front={front}
                hinted={isHinted}
                hintPulseKey={hintPulseKey}
                isPartOfActiveDrag={isPartOfActiveDrag}
                onSelect={onSelect}
                selected={isSelected}
              />
            </div>
          );
        })}
      </AnimatePresence>
    </section>
  );
}

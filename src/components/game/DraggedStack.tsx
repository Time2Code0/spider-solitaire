"use client";

import type { CardBackId, CardFrontId, Card as CardModel } from "@/game/types";
import { CardStatic } from "./Card";

const FANOUT_UP = 0.27;
const FANOUT_DOWN = 0.12;

export interface DraggedStackProps {
  back: CardBackId;
  cards: CardModel[];
  front: CardFrontId;
}

export function DraggedStack(props: DraggedStackProps) {
  const { cards, front, back } = props;

  if (cards.length === 0) {
    return null;
  }

  const offsets: number[] = [];
  let cursor = 0;
  for (const card of cards) {
    offsets.push(cursor);
    cursor += card.faceUp ? FANOUT_UP : FANOUT_DOWN;
  }
  const lastOffset = offsets.at(-1) ?? 0;

  return (
    <div
      aria-hidden
      className="pointer-events-none"
      style={{
        position: "relative",
        width: "var(--card-w)",
        height: `calc(var(--card-h) * (1 + ${lastOffset}))`,
      }}
    >
      {cards.map((card, idx) => (
        <div
          className="absolute left-0 w-full"
          key={card.id}
          style={{ top: `calc(var(--card-h) * ${offsets[idx] ?? 0})` }}
        >
          <CardStatic back={back} card={card} front={front} />
        </div>
      ))}
    </div>
  );
}

"use client";

import { motion } from "motion/react";
import { describeFront } from "@/game/decks";
import type { Card, CardFrontId } from "@/game/types";
import { SUIT_NAMES } from "@/game/types";

export interface FoundationsProps {
  foundations: Card[][];
  front: CardFrontId;
}

const TOTAL_FOUNDATION_SLOTS = 8;

export function Foundations({ foundations, front }: FoundationsProps) {
  const slots: (Card | null)[] = [];
  for (let i = 0; i < TOTAL_FOUNDATION_SLOTS; i++) {
    const suite = foundations[i];
    slots.push(suite && suite.length > 0 ? (suite.at(-1) as Card) : null);
  }
  const completed = foundations.length;

  return (
    <div className="flex items-center gap-3">
      <div className="text-left font-medium text-ink-dim text-xs uppercase tracking-widest">
        <div className="text-ink/90">Suits</div>
        <div className="tabular-nums">
          {completed}/{TOTAL_FOUNDATION_SLOTS}
        </div>
      </div>
      <div
        className="grid grid-cols-8"
        style={{
          gap: "calc(var(--board-gap) * 0.6)",
        }}
      >
        {slots.map((top, index) => (
          <FoundationSlot front={front} key={index} topCard={top} />
        ))}
      </div>
    </div>
  );
}

function FoundationSlot({
  front,
  topCard,
}: {
  front: CardFrontId;
  topCard: Card | null;
}) {
  if (!topCard) {
    return (
      <div
        aria-label="Empty foundation"
        className="card-empty-slot"
        role="img"
        style={{
          width: "calc(var(--card-w) * 0.72)",
          height: "calc(var(--card-h) * 0.72)",
        }}
      />
    );
  }
  const desc = describeFront(front, topCard.rank, topCard.suit);
  return (
    <motion.div
      animate={{ scale: 1, opacity: 1 }}
      aria-label={`Completed ${SUIT_NAMES[topCard.suit]}s`}
      className="card-surface"
      initial={{ scale: 0.6, opacity: 0 }}
      layoutId={topCard.id}
      style={{
        width: "calc(var(--card-w) * 0.72)",
        height: "calc(var(--card-h) * 0.72)",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
    >
      {desc.mode === "img" ? (
        <img
          alt=""
          aria-hidden
          className="card-inner-img"
          draggable={false}
          src={desc.src}
        />
      ) : (
        <svg
          aria-hidden
          className="card-inner-img"
          preserveAspectRatio="xMidYMid meet"
          viewBox={desc.viewBox}
          xmlns="http://www.w3.org/2000/svg"
        >
          <title>Foundation card</title>
          <use href={`${desc.spritePath}#${desc.id}`} />
        </svg>
      )}
    </motion.div>
  );
}

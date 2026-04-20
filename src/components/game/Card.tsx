"use client";

import { useDraggable } from "@dnd-kit/core";
import { motion } from "motion/react";
import { memo } from "react";
import { describeBack, describeFront } from "@/game/decks";
import type { CardBackId, CardFrontId, Card as CardModel } from "@/game/types";
import { RANK_LABELS, SUIT_NAMES } from "@/game/types";

export interface CardProps {
  back: CardBackId;
  card: CardModel;
  cardIndex: number;
  columnIndex: number;
  draggable?: boolean;
  front: CardFrontId;
  highlighted?: boolean;
  hinted?: boolean;
  hintPulseKey?: number;
  isPartOfActiveDrag?: boolean;
  onSelect?: (columnIndex: number, cardIndex: number) => void;
  selected?: boolean;
}

function CardBase(props: CardProps) {
  const {
    card,
    columnIndex,
    cardIndex,
    front,
    back,
    selected,
    highlighted,
    hinted,
    hintPulseKey,
    isPartOfActiveDrag = false,
    draggable = true,
    onSelect,
  } = props;

  const dragEnabled = draggable && card.faceUp;
  const dragId = `${columnIndex}:${cardIndex}:${card.id}`;
  const { attributes, listeners, setNodeRef, isDragging, transform } =
    useDraggable({
      id: dragId,
      disabled: !dragEnabled,
      data: { columnIndex, cardIndex, cardId: card.id },
    });

  const handleClick = () => {
    onSelect?.(columnIndex, cardIndex);
  };

  const style: React.CSSProperties = {
    ...(transform && !isPartOfActiveDrag
      ? {
          transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
          zIndex: isDragging ? 50 : undefined,
        }
      : {}),
    ...(isPartOfActiveDrag ? { visibility: "hidden" as const } : {}),
  };

  const label = card.faceUp
    ? `${RANK_LABELS[card.rank]} of ${SUIT_NAMES[card.suit]}s`
    : "Face-down card";

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      className={[
        "card-surface absolute top-0 left-0",
        dragEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        card.faceUp ? "" : "card-surface--facedown",
        selected ? "selection-ring" : "",
        highlighted && !selected ? "highlight-ring" : "",
        hinted && !selected ? "pulse-hint" : "",
        isDragging ? "shadow-2xl" : "",
      ].join(" ")}
      data-card-id={card.id}
      exit={{ opacity: 0, scale: 0.6 }}
      initial={{ opacity: 0, scale: 0.85 }}
      key={hinted ? `hint-${hintPulseKey ?? 0}` : undefined}
      layoutId={card.id}
      onClick={handleClick}
      ref={setNodeRef}
      style={style}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
      {...listeners}
      {...attributes}
      aria-label={label}
      role="button"
      tabIndex={card.faceUp ? 0 : -1}
    >
      {card.faceUp ? (
        <CardFace back={back} card={card} front={front} />
      ) : (
        <CardBack back={back} front={front} />
      )}
    </motion.div>
  );
}

function CardFace({
  card,
  front,
}: {
  card: CardModel;
  front: CardFrontId;
  back: CardBackId;
}) {
  const desc = describeFront(front, card.rank, card.suit);
  if (desc.mode === "img") {
    return (
      <img
        alt=""
        aria-hidden
        className="card-inner-img"
        draggable={false}
        src={desc.src}
      />
    );
  }
  return (
    <svg
      aria-hidden
      className="card-inner-img"
      preserveAspectRatio="xMidYMid meet"
      viewBox={desc.viewBox}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Playing card</title>
      <use href={`${desc.spritePath}#${desc.id}`} />
    </svg>
  );
}

function CardBack({ front, back }: { front: CardFrontId; back: CardBackId }) {
  const desc = describeBack(front, back);
  return (
    <img
      alt=""
      aria-hidden
      className="card-inner-img"
      draggable={false}
      src={desc.src}
    />
  );
}

export interface CardStaticProps {
  back: CardBackId;
  card: CardModel;
  front: CardFrontId;
}

export function CardStatic({ card, front, back }: CardStaticProps) {
  return (
    <div
      aria-hidden
      className={[
        "card-surface",
        card.faceUp ? "" : "card-surface--facedown",
        "shadow-2xl",
      ].join(" ")}
    >
      {card.faceUp ? (
        <CardFace back={back} card={card} front={front} />
      ) : (
        <CardBack back={back} front={front} />
      )}
    </div>
  );
}

export const Card = memo(CardBase);

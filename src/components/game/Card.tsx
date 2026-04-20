"use client";

import { motion, useMotionValue } from "motion/react";
import { memo } from "react";
import { describeBack, describeFront } from "@/game/decks";
import type { CardBackId, CardFrontId, Card as CardModel } from "@/game/types";
import { RANK_LABELS, SUIT_NAMES } from "@/game/types";
import { cn } from "@/lib/utils";
import { findDropColumn, useDragContext } from "./DragContext";

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

  const { attemptMove, containerRef, setActiveDrag } = useDragContext();

  // Motion drives transform for the leader card (the one actively being
  // dragged). Follower cards receive their offset via a CSS variable set on
  // an ancestor (see Column.tsx), so these motion values stay at 0 for them.
  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const dragEnabled = draggable && card.faceUp;

  const handleClick = () => {
    onSelect?.(columnIndex, cardIndex);
  };

  const label = card.faceUp
    ? `${RANK_LABELS[card.rank]} of ${SUIT_NAMES[card.suit]}s`
    : "Face-down card";

  const resetDragOffsets = () => {
    x.set(0);
    y.set(0);
    const container = containerRef.current;
    if (container) {
      container.style.setProperty("--drag-x", "0px");
      container.style.setProperty("--drag-y", "0px");
    }
  };

  return (
    <motion.div
      animate={{ opacity: 1, scale: 1 }}
      aria-label={label}
      className={cn(
        "card-surface absolute top-0 left-0",
        dragEnabled ? "cursor-grab active:cursor-grabbing" : "cursor-pointer",
        !card.faceUp && "card-surface--facedown",
        selected && "selection-ring",
        highlighted && !selected && "highlight-ring",
        hinted && !selected && "pulse-hint",
        isPartOfActiveDrag && "shadow-2xl"
      )}
      data-card-id={card.id}
      drag={dragEnabled}
      dragElastic={0}
      dragMomentum={false}
      dragSnapToOrigin={false}
      exit={{ opacity: 0, scale: 0.6 }}
      initial={{ opacity: 0, scale: 0.85 }}
      key={hinted ? `hint-${hintPulseKey ?? 0}` : undefined}
      layoutId={card.id}
      onClick={handleClick}
      onDrag={(_event, info) => {
        const container = containerRef.current;
        if (container) {
          container.style.setProperty("--drag-x", `${info.offset.x}px`);
          container.style.setProperty("--drag-y", `${info.offset.y}px`);
        }
      }}
      onDragEnd={(_event, info) => {
        const target = findDropColumn(info.point.x, info.point.y);
        const moved =
          target !== null &&
          target !== columnIndex &&
          attemptMove(columnIndex, cardIndex, target);
        if (!moved) {
          // Failed drop: snap everything back to source immediately. A valid
          // drop intentionally keeps Motion's x/y and the CSS variables at
          // their final values so the `layoutId` animation starts from the
          // drop point and springs to the new slot.
          resetDragOffsets();
        }
        setActiveDrag(null);
      }}
      onDragStart={() => {
        resetDragOffsets();
        setActiveDrag({ columnIndex, cardIndex });
      }}
      role="button"
      style={{
        x,
        y,
        zIndex: isPartOfActiveDrag ? 50 : undefined,
      }}
      tabIndex={card.faceUp ? 0 : -1}
      transition={{ type: "spring", stiffness: 360, damping: 32 }}
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
      className={cn(
        "card-surface",
        !card.faceUp && "card-surface--facedown",
        "shadow-2xl"
      )}
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

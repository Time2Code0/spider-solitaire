"use client";

import { motion } from "motion/react";
import { describeBack } from "@/game/decks";
import type { Card, CardBackId, CardFrontId } from "@/game/types";
import { cn } from "@/lib/utils";
import { dealFlyDelayMs, FLY_DURATION_MS } from "./deal-animation";

export interface StockProps {
  back: CardBackId;
  canDeal: boolean;
  front: CardFrontId;
  hintPulse: boolean;
  hintPulseKey: number;
  onDeal: () => void;
  stock: Card[][];
}

export function Stock(props: StockProps) {
  const { stock, front, back, canDeal, hintPulse, hintPulseKey, onDeal } =
    props;

  const desc = describeBack(front, back);
  const remaining = stock.length;
  // The next pile to be dealt. When the user clicks, these 10 cards fly to
  // columns 0..9. Rendering them here as motion.divs with `layoutId={card.id}`
  // gives Motion a known "from" bounding box; the matching layoutIds then
  // remount inside each column, and Motion crossfades the position.
  const nextDeal = stock[0] ?? [];

  return (
    <div className="flex items-center gap-3">
      <div className="text-right font-medium text-ink-dim text-xs uppercase tracking-widest">
        <div className="text-ink/90">Stock</div>
        <div className="tabular-nums">{remaining} left</div>
      </div>
      <button
        aria-label={
          canDeal ? `Deal from stock, ${remaining} deals left` : "Stock empty"
        }
        className={cn(
          "relative shrink-0",
          canDeal ? "cursor-pointer" : "cursor-not-allowed opacity-50",
          hintPulse && "pulse-hint"
        )}
        disabled={!canDeal}
        key={hintPulse ? `stock-hint-${hintPulseKey}` : undefined}
        onClick={onDeal}
        style={{ width: "var(--card-w)", height: "var(--card-h)" }}
        type="button"
      >
        {remaining === 0 ? (
          <div className="card-empty-slot" />
        ) : (
          <>
            {/* Decorative backdrop stack — rows 2..4 give the pile its depth.
                The topmost slot (i=0) is rendered by the motion ghost cards
                below so that layoutId tracking and the visible top card are
                the same element. */}
            {Array.from(
              { length: Math.max(0, Math.min(remaining, 4) - 1) },
              (_, i) => {
                const depthIndex = i + 1;
                return (
                  <div
                    className="card-surface card-surface--facedown absolute top-0"
                    key={`stock-deco-${depthIndex}`}
                    style={{
                      transform: `translate(${-depthIndex * 2}px, ${-depthIndex * 2}px)`,
                      zIndex: remaining - depthIndex,
                    }}
                  />
                );
              }
            )}
            {/* Ghost layoutId cards for the next deal. All 10 share the same
                bbox (top-left of the stock button), so every card flies out
                from the pile's top. Per-column delay staggers the cascade. */}
            {nextDeal.map((card, i) => (
              <motion.div
                aria-hidden
                className="card-surface card-surface--facedown absolute top-0 left-0"
                key={card.id}
                layoutId={card.id}
                style={{ zIndex: remaining + i }}
                transition={{
                  type: "tween",
                  duration: FLY_DURATION_MS / 1000,
                  delay: dealFlyDelayMs(i) / 1000,
                  ease: [0.22, 0.61, 0.36, 1],
                }}
              >
                {/* Only the topmost card needs a visible back image; the rest
                    sit beneath it and would be fully obscured anyway. */}
                {i === nextDeal.length - 1 ? (
                  <img
                    alt=""
                    aria-hidden
                    className="card-inner-img"
                    draggable={false}
                    src={desc.src}
                  />
                ) : null}
              </motion.div>
            ))}
          </>
        )}
      </button>
    </div>
  );
}

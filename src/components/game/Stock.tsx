"use client";

import { describeBack } from "@/game/decks";
import type { Card, CardBackId, CardFrontId } from "@/game/types";
import { cn } from "@/lib/utils";

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
          Array.from({ length: Math.min(remaining, 4) }, (_, i) => (
            <div
              className="card-surface card-surface--facedown absolute top-0"
              key={i}
              style={{
                transform: `translate(${-i * 2}px, ${-i * 2}px)`,
                zIndex: remaining - i,
              }}
            >
              {i === 0 ? (
                <img
                  alt=""
                  aria-hidden
                  className="card-inner-img"
                  draggable={false}
                  src={desc.src}
                />
              ) : null}
            </div>
          ))
        )}
      </button>
    </div>
  );
}

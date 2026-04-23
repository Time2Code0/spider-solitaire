"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { describeFront } from "@/game/decks";
import { isWon } from "@/game/engine";
import { useSettingsStore } from "@/game/settings-store";
import { selectCurrentGame, useGameStore } from "@/game/game-store";
import type { Card, CardFrontId } from "@/game/types";

const CASCADE_COUNT = 24;

export function WinFlourish() {
  const game = useGameStore(selectCurrentGame);
  const front = useSettingsStore((s) => s.settings.cardFront);
  const prefersReduced = useReducedMotion();
  const [isPlaying, setIsPlaying] = useState(false);
  const [seed, setSeed] = useState(0);

  const hasWon = game ? isWon(game) : false;

  useEffect(() => {
    if (!hasWon) {
      return;
    }
    if (!game?.completedAt) {
      return;
    }
    if (prefersReduced) {
      return;
    }
    setIsPlaying(true);
    setSeed((s) => s + 1);
    const t = window.setTimeout(() => setIsPlaying(false), 4200);
    return () => window.clearTimeout(t);
  }, [game?.completedAt, hasWon, prefersReduced]);

  if (!(isPlaying && game)) {
    return null;
  }

  const seeds = buildCascade(game.foundations, seed);

  return (
    <AnimatePresence>
      {isPlaying ? (
        <motion.div
          animate={{ opacity: 1 }}
          className="pointer-events-none fixed inset-0 z-30"
          exit={{ opacity: 0 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {seeds.map((item, index) => (
            <CascadeCard
              card={item.card}
              front={front}
              index={index}
              key={`${seed}-${index}`}
              total={seeds.length}
            />
          ))}
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

function CascadeCard({
  card,
  front,
  index,
  total,
}: {
  card: Card;
  front: CardFrontId;
  index: number;
  total: number;
}) {
  const desc = describeFront(front, card.rank, card.suit);
  const viewportW = typeof window === "undefined" ? 1200 : window.innerWidth;
  const viewportH = typeof window === "undefined" ? 800 : window.innerHeight;

  const startX = -120 + (index / total) * (viewportW + 240);
  const startY = -180;
  const endX = startX + (index % 2 === 0 ? 60 : -60);
  const endY = viewportH + 200;
  const rotate = (index % 4) * 20 - 30;

  return (
    <motion.div
      animate={{ x: endX, y: endY, rotate, opacity: 1 }}
      className="card-surface absolute top-0 left-0"
      initial={{ x: startX, y: startY, rotate: 0, opacity: 1 }}
      style={{ zIndex: 5 + (index % 5) }}
      transition={{
        duration: 3.6,
        delay: index * 0.08,
        ease: [0.37, 0, 0.63, 1],
      }}
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
          <title>Winning card</title>
          <use href={`${desc.spritePath}#${desc.id}`} />
        </svg>
      )}
    </motion.div>
  );
}

function buildCascade(foundations: Card[][], seed: number): { card: Card }[] {
  const pool: Card[] = [];
  for (const suite of foundations) {
    for (const card of suite) {
      pool.push(card);
    }
  }
  if (pool.length === 0) {
    return [];
  }
  const result: { card: Card }[] = [];
  const rng = makeRng(seed * 997 + pool.length);
  for (let i = 0; i < CASCADE_COUNT; i++) {
    const idx = Math.floor(rng() * pool.length);
    result.push({ card: pool[idx] as Card });
  }
  return result;
}

function makeRng(seed: number): () => number {
  // biome-ignore lint/suspicious/noBitwiseOperators: LCG seed normalization
  let state = Math.max(1, seed >>> 0);
  return () => {
    // biome-ignore lint/suspicious/noBitwiseOperators: LCG update step
    state = (state * 1_664_525 + 1_013_904_223) >>> 0;
    return state / 4_294_967_296;
  };
}

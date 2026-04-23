"use client";

import { Frown, RefreshCcw } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { isWon } from "@/game/engine";
import { selectCurrentGame, useGameStore } from "@/game/store";
import { GameDialog } from "./GameDialog";
import { GameSummary } from "./GameSummary";

const LOSE_DIALOG_DELAY_MS = 800;

export function LoseDialog() {
  const game = useGameStore(selectCurrentGame);
  const startNewGame = useGameStore((s) => s.startNewGame);

  const [open, setOpen] = useState(false);

  const completedAt = game?.completedAt ?? null;
  const lost = !!(game && completedAt !== null && !isWon(game));

  useEffect(() => {
    if (!lost) {
      setOpen(false);
      return;
    }
    const t = window.setTimeout(() => setOpen(true), LOSE_DIALOG_DELAY_MS);
    return () => window.clearTimeout(t);
  }, [lost]);

  // Guarded explicitly against stale state (e.g. the user just won via a
  // recent undo-redo); a lost game has a `completedAt` but isn't won.
  if (!game || game.completedAt === null || isWon(game)) {
    return null;
  }

  const onClose = () => setOpen(false);
  const onPlayAgain = () => {
    setOpen(false);
    startNewGame();
  };

  return (
    <GameDialog
      footer={
        <>
          <Button onClick={onClose} size="lg" variant="ghost">
            Close
          </Button>
          <Button
            className="ease-out active:scale-97"
            onClick={onPlayAgain}
            size="lg"
            variant="primary"
          >
            <RefreshCcw aria-hidden className="size-5" />
            New game
          </Button>
        </>
      }
      onOpenChange={setOpen}
      open={open}
      title="No more moves"
    >
      <div className="flex flex-col items-center gap-6 py-2 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-white/5 text-ink-dim">
          <Frown aria-hidden className="size-10" strokeWidth={1.8} />
        </div>
        <p className="max-w-md text-ink-dim">
          There are no legal moves left. Close this dialog to undo from the
          bottom bar, or start fresh — this game will count as a loss in your
          statistics.
        </p>
        <GameSummary game={game} />
      </div>
    </GameDialog>
  );
}

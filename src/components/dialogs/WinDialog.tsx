"use client";

import { Award, RefreshCcw, Trophy } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { isWon } from "@/game/engine";
import { isNewBest } from "@/game/stats";
import { selectCurrentGame, useGameStore } from "@/game/store";
import { GameDialog } from "./GameDialog";
import { GameSummary } from "./GameSummary";

export function WinDialog() {
  const open = useGameStore((s) => s.openDialogs.includes("game-won"));
  if (!open) {
    return null;
  }
  return <WinDialogInner />;
}

function WinDialogInner() {
  const game = useGameStore(selectCurrentGame);
  const stats = useGameStore((s) => s.stats);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const closeDialog = useGameStore((s) => s.closeDialog);

  if (!game) {
    return null;
  }
  if (!isWon(game)) {
    return null;
  }

  const difficultyStats = stats[game.difficulty];
  const recordedEntry = difficultyStats.leaderboard[0];
  const currentEntry = {
    moves: game.moves,
    elapsedMs: game.elapsedMs,
    finishedAt: game.completedAt ?? Date.now(),
  };
  const isBest = recordedEntry
    ? recordedEntry.moves === currentEntry.moves &&
      recordedEntry.elapsedMs === currentEntry.elapsedMs
    : isNewBest(difficultyStats, currentEntry);

  const onClose = () => closeDialog("game-won");
  const onPlayAgain = () => {
    closeDialog("game-won");
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
            Play again
          </Button>
        </>
      }
      name="game-won"
      title="You won!"
    >
      <div className="flex flex-col items-center gap-6 py-2 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-gold/20 text-gold">
          <Trophy aria-hidden className="size-10" strokeWidth={1.8} />
        </div>
        <p className="max-w-md text-ink-dim">
          You assembled all eight suits. Here is how this game measured up.
        </p>
        <GameSummary game={game} />
        {isBest ? (
          <div className="flex items-center gap-2 rounded-full border border-gold/40 bg-gold/15 px-4 py-1.5 font-medium text-gold text-sm">
            <Award aria-hidden className="size-4" />
            New personal best
          </div>
        ) : null}
      </div>
    </GameDialog>
  );
}

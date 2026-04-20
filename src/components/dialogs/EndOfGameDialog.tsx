"use client";

import { Award, RefreshCcw, Trophy } from "lucide-react";
import { formatElapsed } from "@/components/game/useTimer";
import { Button } from "@/components/ui/Button";
import { isNewBest } from "@/game/stats";
import { selectCurrentGame, useGameStore } from "@/game/store";
import { GameDialog } from "./DialogPrimitive";

export function EndOfGameDialog() {
  const open = useGameStore((s) => s.openDialogs.includes("end-of-game"));
  if (!open) {
    return null;
  }
  return <EndOfGameDialogInner />;
}

function EndOfGameDialogInner() {
  const game = useGameStore(selectCurrentGame);
  const stats = useGameStore((s) => s.stats);
  const startNewGame = useGameStore((s) => s.startNewGame);
  const closeDialog = useGameStore((s) => s.closeDialog);

  if (!game) {
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

  const onDone = () => closeDialog("end-of-game");
  const onPlayAgain = () => {
    closeDialog("end-of-game");
    startNewGame();
  };

  return (
    <GameDialog
      footer={
        <>
          <Button onClick={onDone} variant="ghost">
            Close
          </Button>
          <Button onClick={onPlayAgain} size="lg" variant="primary">
            <RefreshCcw aria-hidden className="size-5" />
            Play again
          </Button>
        </>
      }
      name="end-of-game"
      title="You won!"
    >
      <div className="flex flex-col items-center gap-6 py-2 text-center">
        <div className="flex size-20 items-center justify-center rounded-full bg-[var(--color-gold)]/20 text-[var(--color-gold)]">
          <Trophy aria-hidden className="size-10" strokeWidth={1.8} />
        </div>
        <p className="max-w-md text-[var(--color-ink-dim)]">
          You assembled all eight suits. Here is how this game measured up.
        </p>
        <div className="grid w-full max-w-lg grid-cols-3 gap-3">
          <Metric
            label="Difficulty"
            value={`${game.difficulty} suit${game.difficulty === 1 ? "" : "s"}`}
          />
          <Metric label="Moves" value={String(game.moves)} />
          <Metric label="Time" value={formatElapsed(game.elapsedMs)} />
        </div>
        {isBest ? (
          <div className="flex items-center gap-2 rounded-full border border-[var(--color-gold)]/40 bg-[var(--color-gold)]/15 px-4 py-1.5 font-medium text-[var(--color-gold)] text-sm">
            <Award aria-hidden className="size-4" />
            New personal best
          </div>
        ) : null}
      </div>
    </GameDialog>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 p-4">
      <div className="font-medium text-[var(--color-ink-muted)] text-xs uppercase tracking-widest">
        {label}
      </div>
      <div className="mt-1 font-semibold text-2xl text-[var(--color-ink)] tabular-nums">
        {value}
      </div>
    </div>
  );
}

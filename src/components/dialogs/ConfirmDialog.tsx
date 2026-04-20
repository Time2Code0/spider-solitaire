"use client";

import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/game/store";
import { GameDialog } from "./DialogPrimitive";

export function ConfirmDialog() {
  const confirmNewGameOpen = useGameStore((s) =>
    s.openDialogs.includes("confirm-new-game")
  );
  const confirmResetOpen = useGameStore((s) =>
    s.openDialogs.includes("confirm-reset-stats")
  );
  return (
    <>
      {confirmNewGameOpen ? <ConfirmNewGame /> : null}
      {confirmResetOpen ? <ConfirmResetStats /> : null}
    </>
  );
}

function ConfirmNewGame() {
  const closeDialog = useGameStore((s) => s.closeDialog);
  const registerAbandonAsLoss = useGameStore((s) => s.registerAbandonAsLoss);
  const startNewGame = useGameStore((s) => s.startNewGame);

  const onCancel = () => closeDialog("confirm-new-game");
  const onConfirm = () => {
    registerAbandonAsLoss();
    startNewGame();
    closeDialog("confirm-new-game");
  };

  return (
    <GameDialog
      footer={
        <>
          <Button onClick={onCancel} variant="ghost">
            Keep playing
          </Button>
          <Button onClick={onConfirm} variant="danger">
            Abandon &amp; new game
          </Button>
        </>
      }
      name="confirm-new-game"
      title="Abandon current game?"
    >
      <p className="text-[var(--color-ink-dim)] text-sm leading-relaxed">
        Starting a new game will abandon the one in progress. The abandoned game
        will count as a loss in your statistics.
      </p>
    </GameDialog>
  );
}

function ConfirmResetStats() {
  const closeDialog = useGameStore((s) => s.closeDialog);
  const resetStats = useGameStore((s) => s.resetStats);

  const onCancel = () => closeDialog("confirm-reset-stats");
  const onConfirm = () => {
    resetStats();
    closeDialog("confirm-reset-stats");
  };

  return (
    <GameDialog
      footer={
        <>
          <Button onClick={onCancel} variant="ghost">
            Cancel
          </Button>
          <Button onClick={onConfirm} variant="danger">
            Reset statistics
          </Button>
        </>
      }
      name="confirm-reset-stats"
      title="Reset all statistics?"
    >
      <p className="text-[var(--color-ink-dim)] text-sm leading-relaxed">
        This will permanently clear your leaderboard, averages, and win-rate
        across all difficulties. This cannot be undone.
      </p>
    </GameDialog>
  );
}

"use client";

import { Button } from "@/components/ui/Button";
import { useGameStore } from "@/game/store";
import { GameDialog } from "./GameDialog";

export function ConfirmDialog() {
  const confirmNewGameOpen = useGameStore((s) =>
    s.openDialogs.includes("confirm-new-game")
  );
  return confirmNewGameOpen ? <ConfirmNewGame /> : null;
}

function ConfirmNewGame() {
  const closeDialog = useGameStore((s) => s.closeDialog);
  const startNewGame = useGameStore((s) => s.startNewGame);

  const onCancel = () => closeDialog("confirm-new-game");
  const onConfirm = () => {
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
      <p className="text-ink-dim text-sm leading-relaxed">
        Starting a new game will abandon the one in progress. The abandoned game
        will count as a loss in your statistics.
      </p>
    </GameDialog>
  );
}

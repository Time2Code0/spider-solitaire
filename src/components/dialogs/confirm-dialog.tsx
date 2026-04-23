"use client";

import { Button } from "@/components/ui/button";
import { GameDialog } from "./game-dialog";

export interface ConfirmDialogProps {
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }
  return (
    <ConfirmNewGame
      onConfirm={onConfirm}
      onOpenChange={onOpenChange}
      open={open}
    />
  );
}

function ConfirmNewGame({ open, onOpenChange, onConfirm }: ConfirmDialogProps) {
  const onCancel = () => onOpenChange(false);
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  return (
    <GameDialog
      footer={
        <>
          <Button onClick={onCancel} variant="ghost">
            Keep playing
          </Button>
          <Button onClick={handleConfirm} variant="danger">
            Abandon &amp; new game
          </Button>
        </>
      }
      onOpenChange={onOpenChange}
      open={open}
      title="Abandon current game?"
    >
      <p className="text-ink-dim text-sm leading-relaxed">
        Starting a new game will abandon the one in progress. The abandoned game
        will count as a loss in your statistics.
      </p>
    </GameDialog>
  );
}

"use client";

import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/Dialog";
import type { DialogName } from "@/game/store";
import { useGameStore } from "@/game/store";
import { cn } from "@/lib/utils";

export interface GameDialogProps {
  children: React.ReactNode;
  description?: string;
  dismissible?: boolean;
  footer?: React.ReactNode;
  name: DialogName;
  size?: "md" | "lg";
  title: string;
}

const sizeClasses: Record<NonNullable<GameDialogProps["size"]>, string> = {
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function GameDialog({
  name,
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
}: GameDialogProps) {
  const open = useGameStore((s) => s.openDialogs.includes(name));
  const openDialog = useGameStore((s) => s.openDialog);
  const closeDialog = useGameStore((s) => s.closeDialog);

  return (
    <Dialog
      disablePointerDismissal={!dismissible}
      onOpenChange={(next) => {
        if (next) {
          openDialog(name);
        } else {
          closeDialog(name);
        }
      }}
      open={open}
    >
      <DialogContent
        className={cn(sizeClasses[size])}
        hideCloseButton={!dismissible}
      >
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description ? (
            <DialogDescription>{description}</DialogDescription>
          ) : null}
        </DialogHeader>
        <DialogBody>{children}</DialogBody>
        {footer ? <DialogFooter>{footer}</DialogFooter> : null}
      </DialogContent>
    </Dialog>
  );
}

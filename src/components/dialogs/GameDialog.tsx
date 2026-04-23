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
import { usePausesTimerWhileOpen } from "@/game/pauseStore";
import { cn } from "@/lib/utils";

export interface GameDialogProps {
  children: React.ReactNode;
  description?: string;
  dismissible?: boolean;
  footer?: React.ReactNode;
  onOpenChange: (open: boolean) => void;
  open: boolean;
  size?: "md" | "lg";
  title: string;
}

const sizeClasses: Record<NonNullable<GameDialogProps["size"]>, string> = {
  md: "max-w-xl",
  lg: "max-w-3xl",
};

export function GameDialog({
  title,
  description,
  children,
  footer,
  size = "md",
  dismissible = true,
  open,
  onOpenChange,
}: GameDialogProps) {
  usePausesTimerWhileOpen(open);

  return (
    <Dialog
      disablePointerDismissal={!dismissible}
      onOpenChange={onOpenChange}
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

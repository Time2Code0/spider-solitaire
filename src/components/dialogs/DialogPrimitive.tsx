"use client";

import { Dialog } from "@base-ui-components/react/dialog";
import { X } from "lucide-react";
import { IconButton } from "@/components/ui/IconButton";
import type { DialogName } from "@/game/store";
import { useGameStore } from "@/game/store";

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
    <Dialog.Root
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
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
        <Dialog.Popup
          className={[
            "fixed top-1/2 left-1/2 z-50 w-full -translate-x-1/2 -translate-y-1/2",
            "flex max-h-[85vh] flex-col overflow-hidden rounded-2xl",
            "border border-[var(--color-gold)]/30 bg-[var(--color-felt-deep)] text-[var(--color-ink)]",
            "shadow-2xl shadow-black/60",
            "transition-[opacity,transform]",
            "data-[state=closed]:scale-95 data-[state=closed]:opacity-0",
            sizeClasses[size],
          ].join(" ")}
        >
          <header className="flex items-start justify-between gap-4 border-white/5 border-b px-7 pt-6 pb-4">
            <div>
              <Dialog.Title className="font-semibold text-[var(--color-ink)] text-xl leading-tight">
                {title}
              </Dialog.Title>
              {description ? (
                <Dialog.Description className="mt-1 text-[var(--color-ink-dim)] text-sm">
                  {description}
                </Dialog.Description>
              ) : null}
            </div>
            {dismissible ? (
              <Dialog.Close
                render={<IconButton icon={X} label="Close" size="md" />}
              />
            ) : null}
          </header>
          <div className="flex-1 overflow-y-auto px-7 py-6">{children}</div>
          {footer ? (
            <footer className="flex justify-end gap-3 border-white/5 border-t bg-black/20 px-7 py-4">
              {footer}
            </footer>
          ) : null}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

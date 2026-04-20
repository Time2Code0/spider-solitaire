"use client";

import { Dialog as BaseDialog } from "@base-ui-components/react/dialog";
import { X } from "lucide-react";
import type { ComponentProps, HTMLAttributes, Ref } from "react";
import { cn } from "@/lib/utils";

export const Dialog = BaseDialog.Root;

export const DialogTrigger = BaseDialog.Trigger;

export const DialogPortal = BaseDialog.Portal;

export const DialogClose = BaseDialog.Close;

export interface DialogOverlayProps
  extends Omit<ComponentProps<typeof BaseDialog.Backdrop>, "className"> {
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function DialogOverlay({
  className,
  ref,
  ...props
}: DialogOverlayProps) {
  return (
    <BaseDialog.Backdrop
      className={cn(
        "fixed inset-0 z-40 bg-black/60 backdrop-blur-sm duration-200",
        "data-[open]:fade-in-0 data-[open]:animate-in",
        "data-[closed]:fade-out-0 data-[closed]:animate-out",
        className
      )}
      ref={ref}
      {...props}
    />
  );
}

export interface DialogContentProps
  extends Omit<ComponentProps<typeof BaseDialog.Popup>, "className"> {
  className?: string;
  /** Hide the default close button in the top-right corner. */
  hideCloseButton?: boolean;
  ref?: Ref<HTMLDivElement>;
}

export function DialogContent({
  children,
  className,
  hideCloseButton,
  ref,
  ...props
}: DialogContentProps) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <BaseDialog.Popup
        className={cn(
          "fixed top-1/2 left-1/2 z-50 w-full max-w-xl -translate-x-1/2 -translate-y-1/2",
          "flex max-h-[85vh] flex-col overflow-hidden rounded-2xl",
          "border border-[var(--color-gold)]/30 bg-[var(--color-felt-deep)] text-[var(--color-ink)]",
          "shadow-2xl shadow-black/60 duration-200",
          "data-[open]:fade-in-0 data-[open]:zoom-in-95 data-[open]:animate-in",
          "data-[closed]:fade-out-0 data-[closed]:zoom-out-95 data-[closed]:animate-out",
          className
        )}
        ref={ref}
        {...props}
      >
        {children}
        {hideCloseButton ? null : (
          <DialogClose
            aria-label="Close"
            className={cn(
              "absolute top-4 right-4 inline-flex size-9 items-center justify-center rounded-full",
              "text-[var(--color-ink-dim)] transition-colors",
              "hover:bg-white/10 hover:text-[var(--color-ink)]",
              "focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2"
            )}
          >
            <X aria-hidden className="size-5" strokeWidth={1.75} />
          </DialogClose>
        )}
      </BaseDialog.Popup>
    </DialogPortal>
  );
}

export function DialogHeader({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <header
      className={cn(
        "flex flex-col gap-1 border-white/5 border-b px-7 pt-6 pr-14 pb-4",
        className
      )}
      {...props}
    />
  );
}

export function DialogBody({
  className,
  ...props
}: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("flex-1 overflow-y-auto px-7 py-6", className)}
      {...props}
    />
  );
}

export function DialogFooter({
  className,
  ...props
}: HTMLAttributes<HTMLElement>) {
  return (
    <footer
      className={cn(
        "flex justify-end gap-3 border-white/5 border-t bg-black/20 px-7 py-4",
        className
      )}
      {...props}
    />
  );
}

export interface DialogTitleProps
  extends Omit<ComponentProps<typeof BaseDialog.Title>, "className"> {
  className?: string;
  ref?: Ref<HTMLHeadingElement>;
}

export function DialogTitle({ className, ref, ...props }: DialogTitleProps) {
  return (
    <BaseDialog.Title
      className={cn(
        "font-semibold text-[var(--color-ink)] text-xl leading-tight",
        className
      )}
      ref={ref}
      {...props}
    />
  );
}

export interface DialogDescriptionProps
  extends Omit<ComponentProps<typeof BaseDialog.Description>, "className"> {
  className?: string;
  ref?: Ref<HTMLParagraphElement>;
}

export function DialogDescription({
  className,
  ref,
  ...props
}: DialogDescriptionProps) {
  return (
    <BaseDialog.Description
      className={cn("text-[var(--color-ink-dim)] text-sm", className)}
      ref={ref}
      {...props}
    />
  );
}

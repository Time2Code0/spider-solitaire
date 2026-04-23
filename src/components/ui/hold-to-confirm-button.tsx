"use client";

import { Check, type LucideIcon, Trash2 } from "lucide-react";
import {
  type CSSProperties,
  type KeyboardEvent,
  type PointerEvent,
  type Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/utils";

export interface HoldToConfirmButtonProps {
  className?: string;
  /** Duration the user must hold to trigger `onConfirm`. */
  holdDurationMs?: number;
  /** Icon shown while holding. Defaults to the idle icon. */
  holdingIcon?: LucideIcon;
  /** Label shown inside the red fill while holding. */
  holdingLabel?: React.ReactNode;
  /** Icon shown in the idle state. */
  icon?: LucideIcon;
  /** Label shown in the idle state. */
  label: React.ReactNode;
  onConfirm: () => void;
  ref?: Ref<HTMLButtonElement>;
  /** Icon shown briefly after a successful hold. */
  successIcon?: LucideIcon;
  /** Label shown briefly after a successful hold. */
  successLabel?: React.ReactNode;
}

type HoldStatus = "idle" | "holding" | "done";

const SUCCESS_FLASH_MS = 1400;
const RELEASE_TRANSITION_MS = 200;

export function HoldToConfirmButton({
  className,
  holdDurationMs = 2000,
  holdingIcon,
  holdingLabel,
  icon: Icon = Trash2,
  label,
  onConfirm,
  ref,
  successIcon: SuccessIcon = Check,
  successLabel = "Done",
}: HoldToConfirmButtonProps) {
  const [status, setStatus] = useState<HoldStatus>("idle");
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const doneTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerIdRef = useRef<number | null>(null);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current !== null) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const cancelHold = useCallback(() => {
    clearHoldTimer();
    setStatus((prev) => (prev === "holding" ? "idle" : prev));
  }, [clearHoldTimer]);

  const beginHold = useCallback(() => {
    if (holdTimerRef.current !== null || status !== "idle") {
      return;
    }
    setStatus("holding");
    holdTimerRef.current = setTimeout(() => {
      holdTimerRef.current = null;
      setStatus("done");
      onConfirm();
      doneTimerRef.current = setTimeout(() => {
        doneTimerRef.current = null;
        setStatus("idle");
      }, SUCCESS_FLASH_MS);
    }, holdDurationMs);
  }, [holdDurationMs, onConfirm, status]);

  useEffect(
    () => () => {
      if (holdTimerRef.current !== null) {
        clearTimeout(holdTimerRef.current);
      }
      if (doneTimerRef.current !== null) {
        clearTimeout(doneTimerRef.current);
      }
    },
    []
  );

  const handlePointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (event.button !== 0) {
      return;
    }
    event.currentTarget.setPointerCapture(event.pointerId);
    pointerIdRef.current = event.pointerId;
    beginHold();
  };

  const releasePointer = (
    event: PointerEvent<HTMLButtonElement>,
    cancel: boolean
  ) => {
    if (pointerIdRef.current === event.pointerId) {
      if (event.currentTarget.hasPointerCapture(event.pointerId)) {
        event.currentTarget.releasePointerCapture(event.pointerId);
      }
      pointerIdRef.current = null;
    }
    if (cancel) {
      cancelHold();
    }
  };

  const handlePointerUp = (event: PointerEvent<HTMLButtonElement>) => {
    releasePointer(event, true);
  };

  const handlePointerLeave = (event: PointerEvent<HTMLButtonElement>) => {
    if (pointerIdRef.current !== null) {
      releasePointer(event, true);
    }
  };

  const handlePointerCancel = (event: PointerEvent<HTMLButtonElement>) => {
    releasePointer(event, true);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.repeat) {
      return;
    }
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      beginHold();
    }
  };

  const handleKeyUp = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      cancelHold();
    }
  };

  const handleBlur = () => cancelHold();

  const OverlayIcon = status === "done" ? SuccessIcon : (holdingIcon ?? Icon);
  const overlayLabel =
    status === "done" ? successLabel : (holdingLabel ?? label);
  const isHolding = status === "holding";
  const isDone = status === "done";

  const style = {
    "--hold-duration": `${holdDurationMs}ms`,
    "--release-duration": `${RELEASE_TRANSITION_MS}ms`,
  } as CSSProperties;

  return (
    <button
      aria-busy={isHolding || undefined}
      className={cn(
        "group relative isolate inline-flex h-10 select-none items-center justify-center gap-2 overflow-hidden rounded-full",
        "border border-red-500/30 bg-black/30 px-5 font-medium text-red-300 text-sm",
        "shadow-black/30 shadow-inner",
        "transition-transform duration-150 ease-out",
        "hover:border-red-500/55 hover:text-red-200",
        "focus-visible:outline-2 focus-visible:outline-red-400 focus-visible:outline-offset-2",
        "active:scale-[0.97]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      data-holding={isHolding || undefined}
      data-status={status}
      disabled={isDone}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      onPointerCancel={handlePointerCancel}
      onPointerDown={handlePointerDown}
      onPointerLeave={handlePointerLeave}
      onPointerUp={handlePointerUp}
      ref={ref}
      style={style}
      type="button"
    >
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute inset-0 flex items-center justify-center gap-2 rounded-full will-change-[clip-path]",
          "bg-linear-to-b from-red-500 to-red-600 text-white",
          "[clip-path:inset(0_100%_0_0)]",
          "transition-[clip-path] duration-(--release-duration) ease-out",
          "group-data-holding:[clip-path:inset(0_0_0_0)]",
          "group-data-holding:duration-(--hold-duration) group-data-holding:ease-linear",
          "group-data-[status=done]:from-emerald-500 group-data-[status=done]:to-emerald-600 group-data-[status=done]:[clip-path:inset(0_0_0_0)]",
          "group-data-[status=done]:duration-(--release-duration)"
        )}
      >
        <OverlayIcon aria-hidden className="size-4" strokeWidth={2.25} />
        {overlayLabel}
      </span>
      <Icon aria-hidden className="size-4" strokeWidth={2} />
      {label}
    </button>
  );
}

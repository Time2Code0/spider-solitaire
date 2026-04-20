"use client";

import type { LucideIcon } from "lucide-react";
import type { Ref } from "react";
import { cn } from "@/lib/utils";

export interface IconButtonProps
  extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, "children"> {
  icon: LucideIcon;
  label: string;
  ref?: Ref<HTMLButtonElement>;
  size?: "md" | "lg";
  tone?: "ghost" | "solid" | "gold";
}

const toneClasses: Record<NonNullable<IconButtonProps["tone"]>, string> = {
  ghost:
    "bg-black/30 text-[var(--color-ink)] hover:bg-black/45 border border-white/10",
  solid:
    "bg-[var(--color-felt-bright)] text-[var(--color-ink)] hover:bg-[var(--color-felt-highlight)] border border-[var(--color-felt-highlight)]",
  gold: "bg-[var(--color-gold)]/95 text-[#1b1305] hover:bg-[var(--color-gold)] border border-[var(--color-gold)]",
};

const sizeClasses: Record<NonNullable<IconButtonProps["size"]>, string> = {
  md: "size-11 [&_svg]:size-5",
  lg: "size-13 [&_svg]:size-6",
};

export function IconButton({
  icon: Icon,
  label,
  className,
  tone = "ghost",
  size = "md",
  ref,
  ...rest
}: IconButtonProps) {
  return (
    <button
      aria-label={label}
      className={cn(
        "flex items-center justify-center rounded-full transition-colors",
        "focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-40",
        toneClasses[tone],
        sizeClasses[size],
        className
      )}
      ref={ref}
      type="button"
      {...rest}
    >
      <Icon aria-hidden strokeWidth={1.75} />
    </button>
  );
}

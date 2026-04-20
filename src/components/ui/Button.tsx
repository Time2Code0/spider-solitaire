"use client";

import type { Ref } from "react";

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  fullWidth?: boolean;
  ref?: Ref<HTMLButtonElement>;
  size?: "sm" | "md" | "lg";
  variant?: "primary" | "secondary" | "ghost" | "danger";
}

const variantClasses: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary:
    "bg-gradient-to-b from-[#f1c062] to-[#c78e2b] text-[#241604] hover:from-[#f4cc7e] hover:to-[#d69a35] border border-[#c78e2b] shadow-lg shadow-black/30",
  secondary:
    "bg-black/35 text-[var(--color-ink)] hover:bg-black/50 border border-white/10",
  ghost:
    "bg-transparent text-[var(--color-ink)] hover:bg-white/10 border border-transparent",
  danger:
    "bg-[#7a2424] text-[var(--color-ink)] hover:bg-[#8f2b2b] border border-[#a13535]",
};

const sizeClasses: Record<NonNullable<ButtonProps["size"]>, string> = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-5 text-base",
  lg: "h-14 px-8 text-lg font-semibold",
};

export function Button({
  variant = "secondary",
  size = "md",
  fullWidth,
  className,
  type = "button",
  ref,
  ...rest
}: ButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-full transition-all",
        "focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-40",
        fullWidth ? "w-full" : "",
        variantClasses[variant],
        sizeClasses[size],
        className ?? "",
      ].join(" ")}
      ref={ref}
      type={type}
      {...rest}
    />
  );
}

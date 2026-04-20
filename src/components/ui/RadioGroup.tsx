"use client";

import { Radio as BaseRadio } from "@base-ui-components/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui-components/react/radio-group";
import { Circle } from "lucide-react";
import type { ComponentProps, Ref } from "react";
import { cn } from "@/lib/utils";

export interface RadioGroupProps
  extends Omit<ComponentProps<typeof BaseRadioGroup>, "className"> {
  className?: string;
  ref?: Ref<HTMLDivElement>;
}

export function RadioGroup({ className, ref, ...props }: RadioGroupProps) {
  return (
    <BaseRadioGroup
      className={cn("grid gap-3", className)}
      ref={ref}
      {...props}
    />
  );
}

export interface RadioGroupItemProps
  extends Omit<ComponentProps<typeof BaseRadio.Root>, "className"> {
  className?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * Small circular radio button, styled like shadcn's RadioGroupItem.
 * Pair with a `<label>` for accessible text.
 */
export function RadioGroupItem({
  className,
  ref,
  ...props
}: RadioGroupItemProps) {
  return (
    <BaseRadio.Root
      className={cn(
        "relative inline-flex aspect-square size-4 shrink-0 items-center justify-center",
        "rounded-full border border-white/25 text-[var(--color-gold)]",
        "transition-[background,border-color,box-shadow]",
        "hover:border-[var(--color-gold)]/60",
        "focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2",
        "data-[checked]:border-[var(--color-gold)]",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      <BaseRadio.Indicator className="relative flex size-full items-center justify-center">
        <Circle
          aria-hidden
          className="size-2 fill-[var(--color-gold)] stroke-[var(--color-gold)]"
        />
      </BaseRadio.Indicator>
    </BaseRadio.Root>
  );
}

export interface RadioGroupCardProps
  extends Omit<ComponentProps<typeof BaseRadio.Root>, "className"> {
  className?: string;
  ref?: Ref<HTMLElement>;
}

/**
 * Card-style radio: the entire card is the clickable target. Children appear
 * inside the card and styling reacts to `data-checked` / `data-unchecked`.
 */
export function RadioGroupCard({
  className,
  ref,
  ...props
}: RadioGroupCardProps) {
  return (
    <BaseRadio.Root
      className={cn(
        "group relative flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3 text-left",
        "border-white/10 bg-black/30 text-[var(--color-ink)] transition-colors",
        "hover:border-[var(--color-gold)]/40 hover:bg-black/40",
        "focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2",
        "data-[checked]:border-[var(--color-gold)] data-[checked]:bg-[var(--color-gold)]/15",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    />
  );
}

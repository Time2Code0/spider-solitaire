"use client";

import { Switch as BaseSwitch } from "@base-ui-components/react/switch";
import type { ComponentProps, Ref } from "react";
import { cn } from "@/lib/utils";

export interface SwitchProps
  extends Omit<ComponentProps<typeof BaseSwitch.Root>, "className"> {
  className?: string;
  ref?: Ref<HTMLElement>;
}

export function Switch({ className, ref, ...props }: SwitchProps) {
  return (
    <BaseSwitch.Root
      className={cn(
        "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
        "bg-white/15 transition-colors",
        "focus-visible:outline-2 focus-visible:outline-[var(--color-gold)] focus-visible:outline-offset-2",
        "data-[checked]:bg-[var(--color-gold)]",
        "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className
      )}
      ref={ref}
      {...props}
    >
      <BaseSwitch.Thumb
        className={cn(
          "pointer-events-none ml-0.5 inline-block size-5 rounded-full bg-white shadow",
          "transition-transform data-[checked]:translate-x-5"
        )}
      />
    </BaseSwitch.Root>
  );
}

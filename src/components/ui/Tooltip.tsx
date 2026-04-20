"use client";

import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { formatForDisplay, type Hotkey } from "@tanstack/react-hotkeys";
import type { ReactElement } from "react";

export interface TooltipProps {
  children: ReactElement<Record<string, unknown>>;
  delay?: number;
  hotkey?: Hotkey | (string & {});
  label: string;
  side?: "top" | "right" | "bottom" | "left";
  sideOffset?: number;
}

// Split on "+" is safe: `formatForDisplay` uses "+" as its canonical separator
// and no modifier label or key symbol it emits contains a literal "+".
const HOTKEY_SEPARATOR = "+";

export function Tooltip({
  children,
  delay,
  hotkey,
  label,
  side = "top",
  sideOffset = 10,
}: TooltipProps) {
  const keys = hotkey
    ? formatForDisplay(hotkey, { separatorToken: HOTKEY_SEPARATOR }).split(
        HOTKEY_SEPARATOR
      )
    : [];

  return (
    <BaseTooltip.Root>
      <BaseTooltip.Trigger delay={delay} render={children} />
      <BaseTooltip.Portal>
        <BaseTooltip.Positioner side={side} sideOffset={sideOffset}>
          <BaseTooltip.Popup
            className={[
              "pointer-events-none flex select-none items-center gap-2 rounded-lg",
              "border border-white/10 bg-[#0a0a0a]/92 px-2.5 py-1.5 backdrop-blur-md",
              "font-medium text-[13px] text-[var(--color-ink)] leading-none",
              "shadow-black/50 shadow-xl",
              "transition-[opacity,transform] duration-150 ease-out",
              "data-ending-style:translate-y-1 data-ending-style:opacity-0",
              "data-starting-style:translate-y-1 data-starting-style:opacity-0",
            ].join(" ")}
          >
            <span>{label}</span>
            {keys.length > 0 ? (
              <span className="flex items-center gap-1">
                {keys.map((key, i) => (
                  <kbd
                    className={[
                      "inline-flex h-[18px] min-w-[18px] items-center justify-center",
                      "rounded-[5px] border border-white/20 bg-white/8 px-1",
                      "font-mono font-semibold text-[10.5px] leading-none tracking-wide",
                      "text-[var(--color-ink)]/90",
                      "shadow-[inset_0_-1px_0_rgba(0,0,0,0.4),inset_0_1px_0_rgba(255,255,255,0.08)]",
                    ].join(" ")}
                    key={`${key}-${i}`}
                  >
                    {key}
                  </kbd>
                ))}
              </span>
            ) : null}
          </BaseTooltip.Popup>
        </BaseTooltip.Positioner>
      </BaseTooltip.Portal>
    </BaseTooltip.Root>
  );
}

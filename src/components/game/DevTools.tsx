"use client";

import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import { Skull, Trophy } from "lucide-react";
import type { Ref } from "react";
import { Tooltip } from "@/components/ui/Tooltip";
import { selectCurrentGame, useGameStore } from "@/game/store";
import { cn } from "@/lib/utils";

export function DevTools() {
  const present = useGameStore(selectCurrentGame);
  const devForceWin = useGameStore((s) => s.devForceWin);
  const devForceLose = useGameStore((s) => s.devForceLose);

  return (
    <BaseTooltip.Provider closeDelay={80} delay={350}>
      <div className="flex items-center gap-1.5 rounded-full border border-fuchsia-400/40 border-dashed bg-fuchsia-500/6 py-1 pr-1.5 pl-2.5">
        <span
          className="select-none font-mono font-semibold text-[10px] text-fuchsia-200/80 uppercase tracking-[0.22em]"
          title="Development-only controls"
        >
          dev
        </span>
        <Tooltip hotkey="Shift+W" label="Dev · Force win">
          <DevIconButton
            aria-label="Dev: force win"
            disabled={!present}
            onClick={devForceWin}
          >
            <Trophy aria-hidden className="size-4" strokeWidth={2} />
          </DevIconButton>
        </Tooltip>
        <Tooltip hotkey="Shift+L" label="Dev · Force loss">
          <DevIconButton
            aria-label="Dev: force loss"
            disabled={!present}
            onClick={devForceLose}
          >
            <Skull aria-hidden className="size-4" strokeWidth={2} />
          </DevIconButton>
        </Tooltip>
      </div>
    </BaseTooltip.Provider>
  );
}

interface DevIconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  ref?: Ref<HTMLButtonElement>;
}

function DevIconButton({
  className,
  ref,
  children,
  ...rest
}: DevIconButtonProps) {
  return (
    <button
      className={cn(
        "flex size-8 items-center justify-center rounded-full",
        "border border-fuchsia-400/50 border-dashed bg-fuchsia-500/10",
        "text-fuchsia-100 transition-colors",
        "hover:bg-fuchsia-500/25 hover:text-white",
        "focus-visible:outline-2 focus-visible:outline-fuchsia-300 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className
      )}
      ref={ref}
      type="button"
      {...rest}
    >
      {children}
    </button>
  );
}

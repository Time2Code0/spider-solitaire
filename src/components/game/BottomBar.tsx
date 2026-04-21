"use client";

import { Tooltip as BaseTooltip } from "@base-ui-components/react/tooltip";
import NumberFlow, { NumberFlowGroup } from "@number-flow/react";
import {
  BarChart3,
  Lightbulb,
  Play,
  RotateCcw,
  Settings as SettingsIcon,
  Timer,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { Tooltip } from "@/components/ui/Tooltip";
import { isWon } from "@/game/engine";
import { selectCanUndo, selectCurrentGame, useGameStore } from "@/game/store";
import { DevTools } from "./DevTools";

export function BottomBar() {
  const present = useGameStore(selectCurrentGame);
  const canUndo = useGameStore(selectCanUndo);
  const openDialog = useGameStore((s) => s.openDialog);
  const settings = useGameStore((s) => s.settings);
  const undo = useGameStore((s) => s.undo);
  const cycleHint = useGameStore((s) => s.cycleHint);
  const startNewGame = useGameStore((s) => s.startNewGame);

  const moves = present?.moves ?? 0;
  const elapsed = present?.elapsedMs ?? 0;

  const handleNewGame = () => {
    if (
      !present ||
      present.moves === 0 ||
      isWon(present) ||
      !settings.confirmNewGame
    ) {
      startNewGame();
      return;
    }
    openDialog("confirm-new-game");
  };

  return (
    <div className="fixed right-0 bottom-0 left-0 z-40 flex h-(--bottom-bar-h) items-center gap-6 border-white/10 border-t bg-black/55 px-8 backdrop-blur-xl">
      <div className="flex flex-1 items-center gap-3">
        <BaseTooltip.Provider closeDelay={80} delay={350}>
          <Tooltip label="Settings">
            <IconButton
              icon={SettingsIcon}
              label="Open settings"
              onClick={() => openDialog("settings")}
            />
          </Tooltip>
          <Tooltip label="Statistics">
            <IconButton
              icon={BarChart3}
              label="Open statistics"
              onClick={() => openDialog("stats")}
            />
          </Tooltip>
          <Tooltip hotkey="Mod+Z" label="Undo">
            <IconButton
              disabled={!canUndo}
              icon={RotateCcw}
              label="Undo last move"
              onClick={undo}
            />
          </Tooltip>
          <Tooltip hotkey="H" label="Hint">
            <IconButton
              disabled={!present}
              icon={Lightbulb}
              label="Show a hint"
              onClick={cycleHint}
            />
          </Tooltip>
        </BaseTooltip.Provider>
        {process.env.NODE_ENV === "development" && <DevTools />}
      </div>

      <Button
        className="ease-out active:scale-97"
        onClick={handleNewGame}
        size="lg"
        variant="primary"
      >
        <Play aria-hidden className="size-5" strokeWidth={2} />
        New game
      </Button>

      <div className="flex flex-1 items-center justify-end gap-8">
        <Stat icon={<Timer aria-hidden className="size-4" />} label="Time">
          <AnimatedElapsed ms={elapsed} />
        </Stat>
        <Stat label="Moves">
          <NumberFlow
            className="tabular-nums"
            transformTiming={{ duration: 500, easing: "ease-out" }}
            value={moves}
            willChange
          />
        </Stat>
      </div>
    </div>
  );
}

function AnimatedElapsed({ ms }: { ms: number }) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hasHours = hours > 0;

  return (
    <NumberFlowGroup>
      <div
        className="flex items-baseline"
        style={{ fontVariantNumeric: "tabular-nums" }}
      >
        {hasHours ? <NumberFlow trend={1} value={hours} willChange /> : null}
        <NumberFlow
          digits={hasHours ? { 1: { max: 5 } } : undefined}
          format={hasHours ? { minimumIntegerDigits: 2 } : undefined}
          prefix={hasHours ? ":" : ""}
          trend={1}
          value={minutes}
          willChange
        />
        <NumberFlow
          digits={{ 1: { max: 5 } }}
          format={{ minimumIntegerDigits: 2 }}
          prefix=":"
          trend={1}
          value={seconds}
          willChange
        />
      </div>
    </NumberFlowGroup>
  );
}

function Stat({
  label,
  icon,
  children,
}: {
  label: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-1.5 font-medium text-ink-muted text-xs uppercase tracking-widest">
        {icon}
        {label}
      </div>
      <div className="font-semibold text-2xl text-ink leading-none">
        {children}
      </div>
    </div>
  );
}

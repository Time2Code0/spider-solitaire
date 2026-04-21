"use client";

import { HoldToConfirmButton } from "@/components/ui/HoldToConfirmButton";
import { RadioGroup, RadioGroupCard } from "@/components/ui/RadioGroup";
import { Switch } from "@/components/ui/Switch";
import {
  BACKGROUND_COLOR_IDS,
  BACKGROUND_COLORS,
  BACKGROUND_STYLE_IDS,
  BACKGROUND_STYLES,
  CARD_BACK_GROUPS,
  CARD_BACKS,
  CARD_FRONT_IDS,
  CARD_FRONTS,
  describeBack,
  describeFront,
} from "@/game/decks";
import { useGameStore } from "@/game/store";
import type {
  BackgroundColor,
  BackgroundStyle,
  CardBackId,
  CardFrontId,
  Difficulty,
  SoundsMode,
} from "@/game/types";
import { GameDialog } from "./GameDialog";

const DIFFICULTIES: { value: Difficulty; label: string; hint: string }[] = [
  { value: 1, label: "1 suit", hint: "Easiest" },
  { value: 2, label: "2 suits", hint: "Medium" },
  { value: 4, label: "4 suits", hint: "Hardest" },
];

export function SettingsDialog() {
  const open = useGameStore((s) => s.openDialogs.includes("settings"));
  if (!open) {
    return null;
  }
  return <SettingsDialogInner />;
}

function SettingsDialogInner() {
  const settings = useGameStore((s) => s.settings);
  const updateSettings = useGameStore((s) => s.updateSettings);
  const resetStats = useGameStore((s) => s.resetStats);

  return (
    <GameDialog
      description="Preferences apply to the next game you start."
      name="settings"
      size="lg"
      title="Settings"
    >
      <div className="space-y-8">
        <Section label="Default difficulty">
          <RadioGroup
            className="grid grid-cols-3 gap-3"
            onValueChange={(value) =>
              updateSettings({
                defaultDifficulty: Number(value) as Difficulty,
              })
            }
            value={String(settings.defaultDifficulty)}
          >
            {DIFFICULTIES.map((d) => (
              <DifficultyCard
                description={d.hint}
                key={d.value}
                label={d.label}
                value={String(d.value)}
              />
            ))}
          </RadioGroup>
        </Section>

        <Section label="Card front">
          <RadioGroup
            className="grid grid-cols-3 gap-3"
            onValueChange={(value) =>
              updateSettings({ cardFront: value as CardFrontId })
            }
            value={settings.cardFront}
          >
            {CARD_FRONT_IDS.map((id) => (
              <CardFrontRadio front={id} key={id} />
            ))}
          </RadioGroup>
        </Section>

        <Section label="Card back">
          <RadioGroup
            className="flex flex-col gap-5"
            onValueChange={(value) =>
              updateSettings({ cardBack: value as CardBackId })
            }
            value={settings.cardBack}
          >
            {CARD_BACK_GROUPS.map((group) => (
              <div className="space-y-2" key={group.id}>
                <div className="font-medium text-ink-muted text-xs uppercase tracking-[0.18em]">
                  {group.label}
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {group.backs.map((id) => (
                    <CardBackRadio
                      back={id}
                      front={settings.cardFront}
                      key={id}
                    />
                  ))}
                </div>
              </div>
            ))}
          </RadioGroup>
        </Section>

        <Section label="Background">
          <div className="space-y-5">
            <div className="space-y-2">
              <div className="font-medium text-ink-muted text-xs uppercase tracking-[0.18em]">
                Color
              </div>
              <RadioGroup
                className="grid grid-cols-3 gap-3"
                onValueChange={(value) =>
                  updateSettings({
                    background: {
                      ...settings.background,
                      color: value as BackgroundColor,
                    },
                  })
                }
                value={settings.background.color}
              >
                {BACKGROUND_COLOR_IDS.map((id) => (
                  <BackgroundColorRadio
                    color={id}
                    key={id}
                    style={settings.background.style}
                  />
                ))}
              </RadioGroup>
            </div>
            <div className="space-y-2">
              <div className="font-medium text-ink-muted text-xs uppercase tracking-[0.18em]">
                Style
              </div>
              <RadioGroup
                className="grid grid-cols-3 gap-3"
                onValueChange={(value) =>
                  updateSettings({
                    background: {
                      ...settings.background,
                      style: value as BackgroundStyle,
                    },
                  })
                }
                value={settings.background.style}
              >
                {BACKGROUND_STYLE_IDS.map((id) => (
                  <BackgroundStyleRadio
                    color={settings.background.color}
                    key={id}
                    style={id}
                  />
                ))}
              </RadioGroup>
            </div>
          </div>
        </Section>

        <Section label="Interface">
          <div className="space-y-4 rounded-xl border border-white/5 bg-black/25 p-5">
            <ToggleRow
              checked={settings.confirmNewGame}
              description="Ask before abandoning an in-progress game"
              label="Confirm before new game"
              onCheckedChange={(next) =>
                updateSettings({ confirmNewGame: next })
              }
            />
            <div className="h-px bg-white/5" />
            <ToggleRow
              checked={settings.sounds === "on"}
              description="Subtle tones for deals, foundations, and wins"
              label="Sound effects"
              onCheckedChange={(next) =>
                updateSettings({
                  sounds: (next ? "on" : "off") as SoundsMode,
                })
              }
            />
          </div>
        </Section>

        <Section label="Statistics">
          <div className="flex flex-col gap-3 rounded-xl border border-white/5 bg-black/25 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-medium text-ink text-sm">
                Reset all statistics
              </div>
              <p className="text-ink-muted text-xs leading-relaxed">
                Clears leaderboards, averages, and win-rate across every
                difficulty. This cannot be undone.
              </p>
            </div>
            <HoldToConfirmButton
              holdingLabel="Keep holding…"
              label="Hold to reset"
              onConfirm={resetStats}
              successLabel="Statistics cleared"
            />
          </div>
        </Section>
      </div>
    </GameDialog>
  );
}

function Section({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <h3 className="mb-3 font-medium text-ink-dim text-xs uppercase tracking-[0.2em]">
        {label}
      </h3>
      {children}
    </section>
  );
}

function DifficultyCard({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description?: string;
}) {
  return (
    <RadioGroupCard value={value}>
      <span className="font-semibold text-base">{label}</span>
      {description ? (
        <span className="text-ink-muted text-xs">{description}</span>
      ) : null}
    </RadioGroupCard>
  );
}

function CardFrontRadio({ front }: { front: CardFrontId }) {
  const meta = CARD_FRONTS[front];
  const desc = describeFront(front, 1, "S");
  return (
    <RadioGroupCard className="items-center p-4" value={front}>
      <div className="card-surface" style={{ width: 70, height: 102 }}>
        {desc.mode === "img" ? (
          <img
            alt=""
            aria-hidden
            className="card-inner-img"
            draggable={false}
            src={desc.src}
          />
        ) : (
          <svg
            aria-hidden
            className="card-inner-img"
            preserveAspectRatio="xMidYMid meet"
            viewBox={desc.viewBox}
            xmlns="http://www.w3.org/2000/svg"
          >
            <title>Card front preview</title>
            <use href={`${desc.spritePath}#${desc.id}`} />
          </svg>
        )}
      </div>
      <div className="mt-1 text-center">
        <div className="font-semibold text-ink text-sm">{meta.label}</div>
        <div className="text-ink-muted text-xs">{meta.description}</div>
      </div>
    </RadioGroupCard>
  );
}

function CardBackRadio({
  front,
  back,
}: {
  front: CardFrontId;
  back: CardBackId;
}) {
  const meta = CARD_BACKS[back];
  const desc = describeBack(front, back);
  return (
    <RadioGroupCard className="items-center p-3" value={back}>
      <div
        className="card-surface card-surface--facedown"
        style={{ width: 60, height: 86 }}
      >
        <img
          alt=""
          aria-hidden
          className="card-inner-img"
          draggable={false}
          src={desc.src}
        />
      </div>
      <div className="mt-1 text-center font-medium text-ink text-xs">
        {meta.label}
      </div>
    </RadioGroupCard>
  );
}

function BackgroundPreview({
  color,
  style,
  className = "",
}: {
  color: BackgroundColor;
  style: BackgroundStyle;
  className?: string;
}) {
  return (
    <div
      aria-hidden
      className={`felt-backdrop overflow-hidden rounded-lg border border-white/10 ${className}`}
      data-bg-color={color}
      data-bg-style={style}
    />
  );
}

function BackgroundColorRadio({
  color,
  style,
}: {
  color: BackgroundColor;
  style: BackgroundStyle;
}) {
  const meta = BACKGROUND_COLORS[color];
  return (
    <RadioGroupCard className="items-center p-3" value={color}>
      <BackgroundPreview className="h-14 w-full" color={color} style={style} />
      <div className="mt-1 text-center font-medium text-ink text-xs">
        {meta.label}
      </div>
    </RadioGroupCard>
  );
}

function BackgroundStyleRadio({
  color,
  style,
}: {
  color: BackgroundColor;
  style: BackgroundStyle;
}) {
  const meta = BACKGROUND_STYLES[style];
  return (
    <RadioGroupCard className="items-center p-3" value={style}>
      <BackgroundPreview className="h-16 w-full" color={color} style={style} />
      <div className="mt-1 text-center">
        <div className="font-medium text-ink text-sm">{meta.label}</div>
        <div className="text-ink-muted text-xs">{meta.description}</div>
      </div>
    </RadioGroupCard>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onCheckedChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (next: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <div className="font-medium text-ink text-sm">{label}</div>
        {description ? (
          <div className="text-ink-muted text-xs">{description}</div>
        ) : null}
      </div>
      <Switch checked={checked} onCheckedChange={onCheckedChange} />
    </div>
  );
}

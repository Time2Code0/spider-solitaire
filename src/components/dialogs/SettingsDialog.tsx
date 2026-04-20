"use client";

import { Radio } from "@base-ui-components/react/radio";
import { RadioGroup } from "@base-ui-components/react/radio-group";
import { Switch } from "@base-ui-components/react/switch";
import {
  CARD_BACK_IDS,
  CARD_BACKS,
  CARD_FRONT_IDS,
  CARD_FRONTS,
  describeBack,
  describeFront,
} from "@/game/decks";
import { useGameStore } from "@/game/store";
import type {
  CardBackId,
  CardFrontId,
  Difficulty,
  SoundsMode,
} from "@/game/types";
import { GameDialog } from "./DialogPrimitive";

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
  const openDialog = useGameStore((s) => s.openDialog);

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
              <RadioCard
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
            className="grid grid-cols-4 gap-3"
            onValueChange={(value) =>
              updateSettings({ cardBack: value as CardBackId })
            }
            value={settings.cardBack}
          >
            {CARD_BACK_IDS.map((id) => (
              <CardBackRadio back={id} front={settings.cardFront} key={id} />
            ))}
          </RadioGroup>
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
          <button
            className="text-left text-red-400 text-sm underline-offset-2 hover:text-red-300 hover:underline"
            onClick={() => openDialog("confirm-reset-stats")}
            type="button"
          >
            Reset all statistics…
          </button>
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
      <h3 className="mb-3 font-medium text-[var(--color-ink-dim)] text-xs uppercase tracking-[0.2em]">
        {label}
      </h3>
      {children}
    </section>
  );
}

function RadioCard({
  value,
  label,
  description,
}: {
  value: string;
  label: string;
  description?: string;
}) {
  return (
    <Radio.Root
      className={[
        "group flex cursor-pointer flex-col gap-1 rounded-xl border px-4 py-3",
        "border-white/10 bg-black/30 text-[var(--color-ink)] transition-colors",
        "hover:border-[var(--color-gold)]/40 hover:bg-black/40",
        "data-[checked]:border-[var(--color-gold)] data-[checked]:bg-[var(--color-gold)]/15",
      ].join(" ")}
      value={value}
    >
      <span className="font-semibold text-base">{label}</span>
      {description ? (
        <span className="text-[var(--color-ink-muted)] text-xs">
          {description}
        </span>
      ) : null}
      <Radio.Indicator className="absolute" />
    </Radio.Root>
  );
}

function CardFrontRadio({ front }: { front: CardFrontId }) {
  const meta = CARD_FRONTS[front];
  const desc = describeFront(front, 1, "S");
  return (
    <Radio.Root
      className={[
        "group flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-4",
        "border-white/10 bg-black/30 transition-colors",
        "hover:border-[var(--color-gold)]/40 hover:bg-black/40",
        "data-[checked]:border-[var(--color-gold)] data-[checked]:bg-[var(--color-gold)]/15",
      ].join(" ")}
      value={front}
    >
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
      <div className="text-center">
        <div className="font-semibold text-[var(--color-ink)] text-sm">
          {meta.label}
        </div>
        <div className="text-[var(--color-ink-muted)] text-xs">
          {meta.description}
        </div>
      </div>
    </Radio.Root>
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
    <Radio.Root
      className={[
        "group flex cursor-pointer flex-col items-center gap-2 rounded-xl border p-3",
        "border-white/10 bg-black/30 transition-colors",
        "hover:border-[var(--color-gold)]/40 hover:bg-black/40",
        "data-[checked]:border-[var(--color-gold)] data-[checked]:bg-[var(--color-gold)]/15",
      ].join(" ")}
      value={back}
    >
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
      <div className="text-center font-medium text-[var(--color-ink)] text-xs">
        {meta.label}
      </div>
    </Radio.Root>
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
        <div className="font-medium text-[var(--color-ink)] text-sm">
          {label}
        </div>
        {description ? (
          <div className="text-[var(--color-ink-muted)] text-xs">
            {description}
          </div>
        ) : null}
      </div>
      <Switch.Root
        checked={checked}
        className={[
          "relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full",
          "bg-white/15 transition-colors data-[checked]:bg-[var(--color-gold)]",
        ].join(" ")}
        onCheckedChange={onCheckedChange}
      >
        <Switch.Thumb
          className={[
            "pointer-events-none ml-0.5 inline-block size-5 rounded-full bg-white shadow",
            "transition-transform data-[checked]:translate-x-5",
          ].join(" ")}
        />
      </Switch.Root>
    </div>
  );
}

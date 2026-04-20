export type SoundEvent =
  | "pickup"
  | "drop"
  | "invalid"
  | "deal"
  | "foundation"
  | "undo"
  | "win";

interface ToneStep {
  duration: number;
  freq: number;
  gain?: number;
  offset?: number;
  type?: OscillatorType;
}

const TONE_RECIPES: Record<SoundEvent, ToneStep[]> = {
  pickup: [{ freq: 380, duration: 0.07, type: "triangle", gain: 0.18 }],
  drop: [
    { freq: 220, duration: 0.06, type: "triangle", gain: 0.2 },
    { freq: 160, duration: 0.09, offset: 0.04, type: "sine", gain: 0.16 },
  ],
  invalid: [
    { freq: 200, duration: 0.09, type: "square", gain: 0.12 },
    { freq: 150, duration: 0.12, offset: 0.04, type: "square", gain: 0.12 },
  ],
  deal: [
    { freq: 620, duration: 0.04, type: "sine", gain: 0.14 },
    { freq: 540, duration: 0.04, offset: 0.06, type: "sine", gain: 0.14 },
    { freq: 700, duration: 0.04, offset: 0.12, type: "sine", gain: 0.14 },
  ],
  foundation: [
    { freq: 523.25, duration: 0.14, type: "triangle", gain: 0.22 },
    {
      freq: 659.25,
      duration: 0.14,
      offset: 0.08,
      type: "triangle",
      gain: 0.22,
    },
    { freq: 783.99, duration: 0.2, offset: 0.16, type: "triangle", gain: 0.22 },
  ],
  undo: [{ freq: 280, duration: 0.08, type: "sine", gain: 0.15 }],
  win: [
    { freq: 523.25, duration: 0.16, type: "triangle", gain: 0.24 },
    {
      freq: 659.25,
      duration: 0.16,
      offset: 0.12,
      type: "triangle",
      gain: 0.24,
    },
    {
      freq: 783.99,
      duration: 0.16,
      offset: 0.24,
      type: "triangle",
      gain: 0.24,
    },
    { freq: 1046.5, duration: 0.3, offset: 0.36, type: "triangle", gain: 0.24 },
  ],
};

let ctx: AudioContext | null = null;
let masterEnabled = false;

function ensureContext(): AudioContext | null {
  if (typeof window === "undefined") {
    return null;
  }
  if (ctx) {
    return ctx;
  }
  const AudioCtx = window.AudioContext;
  if (!AudioCtx) {
    return null;
  }
  ctx = new AudioCtx();
  return ctx;
}

export function setSoundsEnabled(enabled: boolean): void {
  masterEnabled = enabled;
  if (enabled) {
    const context = ensureContext();
    if (context && context.state === "suspended") {
      context.resume().catch(() => undefined);
    }
  }
}

export function playSound(event: SoundEvent): void {
  if (!masterEnabled) {
    return;
  }
  const context = ensureContext();
  if (!context) {
    return;
  }
  if (context.state === "suspended") {
    context.resume().catch(() => undefined);
  }
  const now = context.currentTime;
  const recipe = TONE_RECIPES[event];
  for (const step of recipe) {
    const osc = context.createOscillator();
    const gain = context.createGain();
    osc.type = step.type ?? "sine";
    osc.frequency.value = step.freq;
    const start = now + (step.offset ?? 0);
    const peak = step.gain ?? 0.2;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(peak, start + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + step.duration);
    osc.connect(gain).connect(context.destination);
    osc.start(start);
    osc.stop(start + step.duration + 0.02);
  }
}

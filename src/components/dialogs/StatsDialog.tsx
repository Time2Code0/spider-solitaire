"use client";

import { Tabs } from "@base-ui-components/react/tabs";
import { formatElapsed } from "@/components/game/useTimer";
import { averageWinElapsedMs, averageWinMoves, winRate } from "@/game/stats";
import { useStatsStore } from "@/game/statsStore";
import type { Difficulty, DifficultyStats } from "@/game/types";
import { cn } from "@/lib/utils";
import { GameDialog } from "./GameDialog";

const DIFFICULTIES: { value: Difficulty; label: string }[] = [
  { value: 1, label: "1 suit" },
  { value: 2, label: "2 suits" },
  { value: 4, label: "4 suits" },
];

export interface StatsDialogProps {
  onOpenChange: (open: boolean) => void;
  open: boolean;
}

export function StatsDialog({ open, onOpenChange }: StatsDialogProps) {
  if (!open) {
    return null;
  }
  return <StatsDialogInner onOpenChange={onOpenChange} open={open} />;
}

function StatsDialogInner({ open, onOpenChange }: StatsDialogProps) {
  const stats = useStatsStore((s) => s.stats);

  return (
    <GameDialog
      description="Win-rate, averages, and your best games for each difficulty."
      onOpenChange={onOpenChange}
      open={open}
      size="lg"
      title="Statistics"
    >
      <Tabs.Root className="flex flex-col gap-5" defaultValue="4">
        <Tabs.List className="relative flex gap-2 rounded-full bg-black/35 p-1">
          {DIFFICULTIES.map((d) => (
            <Tabs.Tab
              className={cn(
                "flex-1 rounded-full px-4 py-2 font-medium text-ink-dim text-sm transition-colors",
                "hover:text-ink",
                "data-[selected]:bg-gold/95 data-[selected]:text-[#1b1305]",
                "focus-visible:outline-2 focus-visible:outline-gold"
              )}
              key={d.value}
              value={String(d.value)}
            >
              {d.label}
            </Tabs.Tab>
          ))}
        </Tabs.List>

        {DIFFICULTIES.map((d) => (
          <Tabs.Panel key={d.value} value={String(d.value)}>
            <StatsPanel stats={stats[d.value]} />
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </GameDialog>
  );
}

function StatsPanel({ stats }: { stats: DifficultyStats }) {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-3">
        <StatCard
          label="Win rate"
          value={`${Math.round(winRate(stats) * 100)}%`}
        />
        <StatCard label="Games" value={String(stats.played)} />
        <StatCard label="Won" value={String(stats.won)} />
        <StatCard
          label="Avg moves"
          value={
            stats.won > 0 ? Math.round(averageWinMoves(stats)).toString() : "—"
          }
        />
      </div>
      <div>
        <h4 className="mb-3 font-medium text-ink-dim text-xs uppercase tracking-[0.2em]">
          Top 10 best games
        </h4>
        {stats.leaderboard.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-black/20 p-5 text-ink-muted text-sm">
            No games won yet. Your best runs will show up here.
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-white/5 bg-black/20">
            <table className="w-full text-sm">
              <thead className="border-white/5 border-b text-ink-muted text-xs uppercase tracking-widest">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">#</th>
                  <th className="px-4 py-3 text-right font-medium">Moves</th>
                  <th className="px-4 py-3 text-right font-medium">Time</th>
                  <th className="px-4 py-3 text-right font-medium">Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.leaderboard.map((entry, i) => (
                  <tr
                    className="border-white/5 border-t tabular-nums first:border-t-0"
                    key={`${entry.finishedAt}-${i}`}
                  >
                    <td className="px-4 py-3 text-ink-muted">{i + 1}</td>
                    <td className="px-4 py-3 text-right text-ink">
                      {entry.moves}
                    </td>
                    <td className="px-4 py-3 text-right text-ink">
                      {formatElapsed(entry.elapsedMs)}
                    </td>
                    <td className="px-4 py-3 text-right text-ink-dim">
                      {formatDate(entry.finishedAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {stats.won > 0 ? (
        <div className="text-ink-muted text-xs">
          Average winning time: {formatElapsed(averageWinElapsedMs(stats))}
        </div>
      ) : null}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-white/5 bg-black/30 p-4">
      <div className="font-medium text-ink-muted text-xs uppercase tracking-widest">
        {label}
      </div>
      <div className="mt-1 font-semibold text-2xl text-ink tabular-nums">
        {value}
      </div>
    </div>
  );
}

function formatDate(ts: number): string {
  try {
    return new Date(ts).toLocaleDateString(undefined, {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return "—";
  }
}

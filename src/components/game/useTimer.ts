"use client";

import { useEffect, useRef } from "react";
import { usePauseStore } from "@/game/pauseStore";
import { useGameStore } from "@/game/store";

const TICK_INTERVAL_MS = 250;

export function useTimer() {
  const hasHydrated = useGameStore((s) => s.hasHydrated);
  const setElapsedMs = useGameStore((s) => s.setElapsedMs);

  const hasUserInteractedRef = useRef<boolean>(false);
  const tabHiddenRef = useRef<boolean>(false);
  const lastTickAtRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }
    const onVisibility = () => {
      tabHiddenRef.current = document.visibilityState === "hidden";
      if (tabHiddenRef.current) {
        lastTickAtRef.current = null;
      }
    };
    onVisibility();
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  useEffect(() => {
    const onInteract = () => {
      hasUserInteractedRef.current = true;
    };
    window.addEventListener("pointerdown", onInteract);
    window.addEventListener("keydown", onInteract);
    return () => {
      window.removeEventListener("pointerdown", onInteract);
      window.removeEventListener("keydown", onInteract);
    };
  }, []);

  useEffect(() => {
    if (!hasHydrated) {
      return;
    }
    const interval = window.setInterval(() => {
      const state = useGameStore.getState();
      const present = state.present;
      if (!present || present.completedAt !== null) {
        lastTickAtRef.current = null;
        return;
      }
      const paused = usePauseStore.getState().pauseCount > 0;
      const shouldRun =
        !paused && hasUserInteractedRef.current && !tabHiddenRef.current;
      if (!shouldRun) {
        lastTickAtRef.current = null;
        return;
      }
      const now = Date.now();
      if (lastTickAtRef.current === null) {
        lastTickAtRef.current = now;
        return;
      }
      const delta = now - lastTickAtRef.current;
      lastTickAtRef.current = now;
      if (delta > 0) {
        setElapsedMs(present.elapsedMs + delta);
      }
    }, TICK_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [hasHydrated, setElapsedMs]);
}

export function formatElapsed(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const rem = minutes % 60;
    return `${hours}:${String(rem).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

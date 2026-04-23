"use client";

import { GameShell } from "@/components/game/game-shell";
import { SmallScreenGate } from "@/components/game/small-screen-gate";
import { useMediaQuery } from "@/hooks/use-media-query";

export default function Page() {
  const isTooNarrow = useMediaQuery({ max: 1023 });
  const isTooShort = useMediaQuery({ maxHeight: 699 });

  if (isTooNarrow || isTooShort) {
    return <SmallScreenGate />;
  }

  return <GameShell />;
}

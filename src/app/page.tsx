import { GameShell } from "@/components/game/game-shell";
import { SmallScreenGate } from "@/components/game/small-screen-gate";

export default function Page() {
  return (
    <>
      <SmallScreenGate />
      <div className="desktop-only">
        <GameShell />
      </div>
    </>
  );
}

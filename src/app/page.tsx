import { GameShell } from "@/components/game/GameShell";
import { SmallScreenGate } from "@/components/game/SmallScreenGate";

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

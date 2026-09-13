import { useEffect, useState } from "react";
import { initSfx, isMuted, setMuted, sfx } from "@/lib/sfx";

export function MuteButton() {
  const [mutedState, setMutedState] = useState(false);

  useEffect(() => {
    initSfx();
    setMutedState(isMuted());
  }, []);

  return (
    <button
      onClick={() => {
        const next = !mutedState;
        setMuted(next);
        setMutedState(next);
        if (!next) sfx.word();
      }}
      aria-label={mutedState ? "Unmute sounds" : "Mute sounds"}
      className="btn-ghost h-10 w-10 !p-0 text-lg"
      title={mutedState ? "Sounds off" : "Sounds on"}
    >
      {mutedState ? "🔇" : "🔊"}
    </button>
  );
}

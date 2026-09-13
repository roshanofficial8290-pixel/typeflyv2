import { useEffect, useState } from "react";
import { SoundEffectsManager } from "@/lib/sfx";

type MuteButtonProps = {
  variant?: "icon" | "pill";
  className?: string;
};

export function MuteButton({ variant = "icon", className = "" }: MuteButtonProps) {
  const [mutedState, setMutedState] = useState(false);

  useEffect(() => {
    SoundEffectsManager.init();
    setMutedState(SoundEffectsManager.isMuted());
    const unsubscribe = SoundEffectsManager.subscribe((isMuted) => {
      setMutedState(isMuted);
    });
    return unsubscribe;
  }, []);

  const handleToggle = () => {
    const next = SoundEffectsManager.toggleMute();
    if (!next) {
      SoundEffectsManager.playWingFlap();
    }
  };

  if (variant === "pill") {
    return (
      <button
        type="button"
        onClick={handleToggle}
        aria-label={mutedState ? "Unmute sound effects" : "Mute sound effects"}
        className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-bold transition-colors ${
          mutedState
            ? "border-muted-foreground/30 bg-muted/60 text-muted-foreground hover:bg-muted"
            : "border-primary/40 bg-primary/10 text-primary hover:bg-primary/20"
        } ${className}`}
        title={
          mutedState
            ? "Sound effects muted (Click to enable)"
            : "Sound effects active (Click to mute)"
        }
      >
        <span>{mutedState ? "🔇" : "🔊"}</span>
        <span>{mutedState ? "Muted" : "Sound On"}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={handleToggle}
      aria-label={mutedState ? "Unmute audio" : "Mute audio"}
      className={`btn-ghost h-10 w-10 !p-0 text-lg transition-transform active:scale-95 ${className}`}
      title={mutedState ? "Sound is muted (Click to unmute)" : "Sound is on (Click to mute)"}
    >
      {mutedState ? "🔇" : "🔊"}
    </button>
  );
}

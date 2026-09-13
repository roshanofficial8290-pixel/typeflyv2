import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface KeyboardShortcutsBarProps {
  mode?: "flight" | "practice" | "general";
  isPaused?: boolean;
  onPauseToggle?: () => void;
  onRestart?: () => void;
  className?: string;
}

export function KeyboardShortcutsBar({
  mode = "flight",
  isPaused = false,
  onPauseToggle,
  onRestart,
  className = "",
}: KeyboardShortcutsBarProps) {
  const [minimized, setMinimized] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("typefly-shortcuts-bar-hidden") === "true";
  });

  const [recentKey, setRecentKey] = useState<string | null>(null);

  // Flash the shortcut badge when user physically presses the shortcut key
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Spacebar
      if (e.code === "Space") {
        setRecentKey("Space");
        setTimeout(() => setRecentKey(null), 300);
      } else if (e.key === "Escape" || e.code === "Escape") {
        setRecentKey("Esc");
        setTimeout(() => setRecentKey(null), 300);
      } else if (
        (e.key === "r" || e.key === "R") &&
        (e.ctrlKey || e.metaKey ? false : true)
      ) {
        // Only flash if not Ctrl+R browser refresh
        setRecentKey("R");
        setTimeout(() => setRecentKey(null), 300);
      }
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  function toggleMinimized() {
    setMinimized((prev) => {
      const next = !prev;
      try {
        window.localStorage.setItem("typefly-shortcuts-bar-hidden", String(next));
      } catch {
        /* ignore */
      }
      return next;
    });
  }

  const shortcuts =
    mode === "flight"
      ? [
          {
            key: "Space",
            label: "Wing Flap / Jump",
            desc: "Flaps wings upward instantly with an aerodynamic swoosh sound.",
            highlight: recentKey === "Space",
          },
          {
            key: "Esc",
            label: isPaused ? "Resume Flight" : "Pause Flight",
            desc: "Freezes flight time & obstacles so you can take a breather.",
            onClick: onPauseToggle,
            highlight: recentKey === "Esc",
          },
          {
            key: "R",
            label: "Restart Flight",
            desc: "Press 'R' (or click) to immediately re-launch a fresh flight.",
            onClick: onRestart,
            highlight: recentKey === "R",
          },
        ]
      : [
          {
            key: "Space",
            label: "Spacebar Word Advance",
            desc: "Advances to the next word in natural typing tests.",
            highlight: recentKey === "Space",
          },
          {
            key: "Esc",
            label: isPaused ? "Resume Timer" : "Pause Timer",
            desc: "Pauses practice timer and keystroke tracking.",
            onClick: onPauseToggle,
            highlight: recentKey === "Esc",
          },
          {
            key: "R",
            label: "Restart Practice",
            desc: "Clears current paragraph and restarts the timer.",
            onClick: onRestart,
            highlight: recentKey === "R",
          },
        ];

  if (minimized) {
    return (
      <TooltipProvider delayDuration={200}>
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              onClick={toggleMinimized}
              aria-label="Show keyboard shortcuts"
              className="inline-flex items-center gap-1.5 rounded-full border border-border/80 bg-card/90 px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm backdrop-blur transition-all hover:border-primary/40 hover:text-foreground"
            >
              <Keyboard className="h-3.5 w-3.5 text-primary" />
              <span>Shortcuts</span>
            </button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Show Space, Esc, and R keyboard shortcuts guide
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider delayDuration={150}>
      <div
        className={`flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-border/70 bg-card/85 px-3.5 py-2 text-xs shadow-sm backdrop-blur-sm ${className}`}
        role="region"
        aria-label="Keyboard shortcuts"
      >
        <div className="flex items-center gap-1.5 text-muted-foreground font-semibold">
          <Keyboard className="h-3.5 w-3.5 text-primary" />
          <span className="text-[11px] uppercase tracking-wider font-extrabold text-foreground/80">
            Hotkeys:
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {shortcuts.map((sc) => {
            const buttonContent = (
              <button
                key={sc.key}
                type="button"
                onClick={sc.onClick}
                className={`flex items-center gap-1.5 rounded-xl border px-2.5 py-1 text-xs font-medium transition-all ${
                  sc.highlight
                    ? "border-primary bg-primary/20 text-primary scale-105 shadow-sm ring-2 ring-primary/40"
                    : "border-border/80 bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground hover:border-border"
                } ${sc.onClick ? "cursor-pointer active:scale-95" : "cursor-default"}`}
              >
                <kbd className="inline-flex h-5 items-center justify-center rounded border border-border bg-background px-1.5 font-mono text-[11px] font-bold text-foreground shadow-2xs">
                  {sc.key}
                </kbd>
                <span className="font-semibold">{sc.label}</span>
              </button>
            );

            return (
              <Tooltip key={sc.key}>
                <TooltipTrigger asChild>{buttonContent}</TooltipTrigger>
                <TooltipContent side="top" className="max-w-xs text-xs">
                  <p className="font-bold text-primary-foreground">{sc.label}</p>
                  <p className="mt-0.5 text-[11px] opacity-90">{sc.desc}</p>
                </TooltipContent>
              </Tooltip>
            );
          })}
        </div>

        <button
          type="button"
          onClick={toggleMinimized}
          className="rounded-lg p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          title="Minimize shortcuts bar"
          aria-label="Minimize shortcuts bar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    </TooltipProvider>
  );
}

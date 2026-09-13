const FINGERS: Record<string, { finger: string; color: string }> = {
  q: { finger: "Left pinky", color: "oklch(0.83 0.11 300)" },
  a: { finger: "Left pinky", color: "oklch(0.83 0.11 300)" },
  z: { finger: "Left pinky", color: "oklch(0.83 0.11 300)" },
  w: { finger: "Left ring", color: "oklch(0.84 0.1 250)" },
  s: { finger: "Left ring", color: "oklch(0.84 0.1 250)" },
  x: { finger: "Left ring", color: "oklch(0.84 0.1 250)" },
  e: { finger: "Left middle", color: "oklch(0.85 0.11 200)" },
  d: { finger: "Left middle", color: "oklch(0.85 0.11 200)" },
  c: { finger: "Left middle", color: "oklch(0.85 0.11 200)" },
  r: { finger: "Left index", color: "oklch(0.86 0.12 150)" },
  f: { finger: "Left index", color: "oklch(0.86 0.12 150)" },
  v: { finger: "Left index", color: "oklch(0.86 0.12 150)" },
  t: { finger: "Left index", color: "oklch(0.86 0.12 150)" },
  g: { finger: "Left index", color: "oklch(0.86 0.12 150)" },
  b: { finger: "Left index", color: "oklch(0.86 0.12 150)" },
  y: { finger: "Right index", color: "oklch(0.89 0.13 105)" },
  h: { finger: "Right index", color: "oklch(0.89 0.13 105)" },
  n: { finger: "Right index", color: "oklch(0.89 0.13 105)" },
  u: { finger: "Right index", color: "oklch(0.89 0.13 105)" },
  j: { finger: "Right index", color: "oklch(0.89 0.13 105)" },
  m: { finger: "Right index", color: "oklch(0.89 0.13 105)" },
  i: { finger: "Right middle", color: "oklch(0.87 0.12 70)" },
  k: { finger: "Right middle", color: "oklch(0.87 0.12 70)" },
  ",": { finger: "Right middle", color: "oklch(0.87 0.12 70)" },
  o: { finger: "Right ring", color: "oklch(0.83 0.13 35)" },
  l: { finger: "Right ring", color: "oklch(0.83 0.13 35)" },
  ".": { finger: "Right ring", color: "oklch(0.83 0.13 35)" },
  p: { finger: "Right pinky", color: "oklch(0.82 0.12 355)" },
  ";": { finger: "Right pinky", color: "oklch(0.82 0.12 355)" },
  "/": { finger: "Right pinky", color: "oklch(0.82 0.12 355)" },
  " ": { finger: "Thumb", color: "oklch(0.88 0.03 250)" },
};

const ROWS = [
  ["q", "w", "e", "r", "t", "y", "u", "i", "o", "p"],
  ["a", "s", "d", "f", "g", "h", "j", "k", "l", ";"],
  ["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"],
];

const LEGEND = [
  { label: "Pinky", color: "oklch(0.83 0.11 300)" },
  { label: "Ring", color: "oklch(0.84 0.1 250)" },
  { label: "Middle", color: "oklch(0.85 0.11 200)" },
  { label: "Index", color: "oklch(0.86 0.12 150)" },
  { label: "Right index", color: "oklch(0.89 0.13 105)" },
  { label: "Right middle", color: "oklch(0.87 0.12 70)" },
  { label: "Right ring", color: "oklch(0.83 0.13 35)" },
  { label: "Right pinky", color: "oklch(0.82 0.12 355)" },
];

export function fingerFor(char: string) {
  return FINGERS[char.toLowerCase()]?.finger ?? "Any comfy finger";
}

export function FingerKeyboard({ nextChar }: { nextChar: string }) {
  const target = nextChar.toLowerCase();
  const currentFinger = fingerFor(target);
  const isLeftHand = currentFinger.startsWith("Left");
  const isRightHand = currentFinger.startsWith("Right");
  const isThumb = currentFinger.includes("Thumb");

  return (
    <div className="panel p-4 sm:p-6">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        <h3 className="font-display text-lg font-bold">Interactive Finger Placement Guide</h3>
        <div className="flex items-center gap-2">
          <span className="text-xs uppercase tracking-wider text-muted-foreground font-bold">
            Next:
          </span>
          <span className="rounded-lg bg-primary/20 px-2.5 py-1 font-mono text-base font-extrabold text-primary">
            {target === " " ? "SPACE ␣" : target || "—"}
          </span>
          <span className="rounded-lg bg-muted px-2.5 py-1 text-xs font-bold text-foreground">
            {currentFinger}
          </span>
        </div>
      </div>

      {/* Hands bar */}
      <div className="mb-4 grid grid-cols-2 gap-3 text-center text-xs font-bold">
        <div
          className={`rounded-xl border-2 p-2 transition-all ${
            isLeftHand || (isThumb && target === " ")
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-border bg-muted/40 text-muted-foreground"
          }`}
        >
          <p className="font-display uppercase tracking-wider text-[11px]">Left Hand</p>
          <p className="mt-0.5 text-xs font-medium">
            {isLeftHand
              ? currentFinger.replace("Left ", "")
              : isThumb
                ? "Left Thumb (Space)"
                : "Resting on A S D F"}
          </p>
        </div>
        <div
          className={`rounded-xl border-2 p-2 transition-all ${
            isRightHand || (isThumb && target === " ")
              ? "border-primary bg-primary/10 shadow-sm"
              : "border-border bg-muted/40 text-muted-foreground"
          }`}
        >
          <p className="font-display uppercase tracking-wider text-[11px]">Right Hand</p>
          <p className="mt-0.5 text-xs font-medium">
            {isRightHand
              ? currentFinger.replace("Right ", "")
              : isThumb
                ? "Right Thumb (Space)"
                : "Resting on J K L ;"}
          </p>
        </div>
      </div>

      <div className="space-y-1.5 overflow-x-auto py-2">
        {ROWS.map((row, i) => (
          <div key={i} className="flex justify-center gap-1.5" style={{ paddingLeft: i * 14 }}>
            {row.map((key) => {
              const active = key === target;
              return (
                <div
                  key={key}
                  className={`flex h-9 w-9 items-center justify-center rounded-lg border-2 font-mono text-sm font-bold transition-all sm:h-11 sm:w-11 sm:text-base select-none ${
                    active ? "ring-2 ring-primary ring-offset-2 scale-110 shadow-md z-10" : ""
                  }`}
                  style={{
                    backgroundColor: FINGERS[key]?.color,
                    borderColor: active ? "var(--foreground)" : "transparent",
                    color: "var(--foreground)",
                  }}
                >
                  {key}
                </div>
              );
            })}
          </div>
        ))}
        <div className="flex justify-center pt-1">
          <div
            className={`flex h-9 w-48 items-center justify-center rounded-lg border-2 text-xs font-bold sm:w-64 transition-all select-none ${
              target === " " ? "ring-2 ring-primary ring-offset-2 scale-105 shadow-md z-10" : ""
            }`}
            style={{
              backgroundColor: FINGERS[" "]!.color,
              borderColor: target === " " ? "var(--foreground)" : "transparent",
              color: "var(--foreground)",
            }}
          >
            space · thumb
          </div>
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2 text-xs border-t border-border pt-3">
        {LEGEND.map((l) => (
          <span
            key={l.label}
            className="flex items-center gap-1.5 rounded-full bg-muted px-2.5 py-1 text-[11px]"
          >
            <span
              className="h-3 w-3 rounded-full shadow-inner"
              style={{ backgroundColor: l.color }}
            />
            {l.label}
          </span>
        ))}
      </div>
    </div>
  );
}

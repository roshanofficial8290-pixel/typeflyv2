import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { FingerKeyboard, fingerFor } from "@/components/FingerKeyboard";
import { BEGINNER_LESSONS } from "@/lib/words";
import { initSfx, sfx } from "@/lib/sfx";
import { saveResult } from "@/lib/results";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/beginner")({
  head: () => ({
    meta: [
      { title: "Beginner Typing Mode — TypeFly" },
      {
        name: "description",
        content:
          "Learn to type from scratch with simple guided text, live accuracy and speed, and a finger placement keyboard guide.",
      },
      { property: "og:title", content: "Beginner Typing Mode — TypeFly" },
      {
        property: "og:description",
        content:
          "Gentle typing practice with a keyboard guide showing which finger presses each key.",
      },
    ],
  }),
  component: BeginnerPage,
});

function BeginnerPage() {
  const { user } = useAuth();
  const [lessonIndex, setLessonIndex] = useState(0);
  const lesson = BEGINNER_LESSONS[lessonIndex]!;
  const text = lesson.text;

  const [typed, setTyped] = useState("");
  const [totalKeys, setTotalKeys] = useState(0);
  const [correctKeys, setCorrectKeys] = useState(0);
  const [errors, setErrors] = useState(0);
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [done, setDone] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => initSfx(), []);

  useEffect(() => {
    if (!startedAt || done) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [startedAt, done]);

  const seconds = startedAt ? Math.max(1, (now - startedAt) / 1000) : 0;
  const wpm = seconds > 2 ? Math.round(correctKeys / 5 / (seconds / 60)) : 0;
  const accuracy = totalKeys > 0 ? Math.round((correctKeys / totalKeys) * 100) : 100;
  const nextChar = text[typed.length] ?? "";

  function reset(index = lessonIndex) {
    setLessonIndex(index);
    setTyped("");
    setTotalKeys(0);
    setCorrectKeys(0);
    setErrors(0);
    setStartedAt(null);
    setDone(false);
    window.setTimeout(() => inputRef.current?.focus(), 30);
  }

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (done) return;
    if (e.key === "Backspace") {
      e.preventDefault();
      setTyped((t) => t.slice(0, -1));
      return;
    }
    const key = e.key === "Enter" ? " " : e.key;
    if (key.length !== 1) return;
    e.preventDefault();
    if (!startedAt) setStartedAt(Date.now());

    const expected = text[typed.length];
    setTotalKeys((n) => n + 1);
    if (key === expected) {
      setCorrectKeys((c) => c + 1);
      sfx.key();
      const nextTyped = typed + key;
      setTyped(nextTyped);
      if (nextTyped.length >= text.length) {
        setDone(true);
        sfx.finish();
        const secs = Math.max(1, (Date.now() - (startedAt ?? Date.now())) / 1000);
        saveResult(
          {
            mode: "beginner",
            durationSeconds: Math.round(secs),
            wpm: Math.round((correctKeys + 1) / 5 / (secs / 60)),
            accuracy: Math.round(((correctKeys + 1) / (totalKeys + 1)) * 100),
            errors,
            characters: correctKeys + 1,
            words: text.trim().split(/\s+/).length,
            bestCombo: 0,
            livesLeft: 3,
            finishedAt: new Date().toISOString(),
          },
          user?.id,
        );
      }
    } else {
      setErrors((x) => x + 1);
      sfx.wrong();
    }
  }

  const rendered = useMemo(
    () =>
      text.split("").map((ch, i) => {
        const isTyped = i < typed.length;
        const correct = isTyped && typed[i] === ch;
        return (
          <span
            key={i}
            className={
              correct
                ? "font-bold text-foreground"
                : isTyped
                  ? "font-bold text-destructive underline"
                  : i === typed.length
                    ? "rounded bg-accent/70 text-foreground"
                    : "text-muted-foreground"
            }
          >
            {ch}
          </span>
        );
      }),
    [text, typed],
  );

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-8">
        <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Beginner Mode</h1>
        <p className="mt-1 text-muted-foreground">
          Brand new to typing? Follow the highlighted letter and let the guide show your fingers the
          way.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          {BEGINNER_LESSONS.map((l, i) => (
            <button
              key={l.id}
              onClick={() => reset(i)}
              className={i === lessonIndex ? "btn-primary text-sm" : "btn-ghost text-sm"}
            >
              {l.title}
            </button>
          ))}
        </div>

        {/* Progress Bar */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-150"
              style={{ width: `${Math.min(100, Math.round((typed.length / text.length) * 100))}%` }}
            />
          </div>
          <span className="font-mono text-xs font-bold text-muted-foreground">
            {Math.min(100, Math.round((typed.length / text.length) * 100))}%
          </span>
        </div>

        <div className="mt-3 grid grid-cols-3 gap-3">
          <Metric label="Speed" value={`${wpm} wpm`} />
          <Metric label="Accuracy" value={`${accuracy}%`} />
          <Metric label="Mistakes" value={String(errors)} />
        </div>

        <div className="panel mt-4 p-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-muted-foreground">{lesson.hint}</p>
            <span className="text-xs text-muted-foreground font-mono">
              {typed.length} / {text.length}
            </span>
          </div>
          <p className="mt-4 font-mono text-xl leading-relaxed sm:text-2xl">{rendered}</p>
          <input
            ref={inputRef}
            value=""
            onChange={() => undefined}
            onKeyDown={handleKey}
            aria-label="Practice typing input"
            autoComplete="off"
            className="mt-5 w-full rounded-2xl border-2 border-input bg-muted px-4 py-3 text-center font-mono outline-none focus:border-primary"
            placeholder={done ? "Lesson complete!" : "Click here and start typing…"}
          />
          <p className="mt-3 text-center text-sm text-muted-foreground">
            Use your <span className="font-bold text-foreground">{fingerFor(nextChar)}</span> next.
          </p>

          {done && (
            <div className="mt-5 flex flex-wrap items-center justify-center gap-3 border-t border-border pt-4">
              <p className="font-display text-lg font-extrabold text-primary">
                Lovely! {wpm} WPM at {accuracy}% accuracy.
              </p>
              <button onClick={() => reset()} className="btn-ghost text-sm">
                Repeat Lesson
              </button>
              {lessonIndex < BEGINNER_LESSONS.length - 1 && (
                <button onClick={() => reset(lessonIndex + 1)} className="btn-primary text-sm">
                  Next Lesson →
                </button>
              )}
              <Link to="/results" className="btn-accent text-sm">
                See Full Results
              </Link>
            </div>
          )}
        </div>

        <div className="mt-4">
          <FingerKeyboard nextChar={nextChar} />
        </div>
      </div>
    </SiteLayout>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="panel px-3 py-2 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="font-display text-xl font-extrabold">{value}</p>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { loadResult, performanceSummary, type TestResult } from "@/lib/results";
import type { Badge } from "@/lib/badges";
import { useAuth } from "@/hooks/useAuth";
import birdImg from "@/assets/bird.png";
import { Award, Sparkles } from "lucide-react";

export const Route = createFileRoute("/results")({
  head: () => ({
    meta: [
      { title: "Your Typing Results — TypeFly" },
      {
        name: "description",
        content:
          "See your WPM, accuracy, errors, characters and words typed with a friendly performance summary.",
      },
      { property: "og:title", content: "Your Typing Results — TypeFly" },
      {
        property: "og:description",
        content: "WPM, accuracy, errors and a performance summary of your last flight.",
      },
    ],
  }),
  component: ResultsPage,
});

function getSpeedTier(wpm: number) {
  if (wpm >= 85)
    return { title: "Sky Sovereign 👑", desc: "Legendary typing speed! You outfly the wind." };
  if (wpm >= 65)
    return { title: "Swift Falcon ⚡", desc: "Razor-sharp pace and fantastic wing velocity!" };
  if (wpm >= 45)
    return { title: "Meadow Skylark 🐦", desc: "Fluid, steady, and confident rhythm." };
  if (wpm >= 25)
    return { title: "Gliding Sparrow 🌱", desc: "Good momentum — fingers are finding the groove." };
  return {
    title: "Fledgling Flight 🐣",
    desc: "Great start! Speed will climb as muscle memory locks in.",
  };
}

function formatDuration(seconds: number) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins === 0) return `${secs}s`;
  return `${mins}m ${secs > 0 ? `${secs}s` : ""}`;
}

function ResultsPage() {
  const { user } = useAuth();
  const [result, setResult] = useState<TestResult | null>(null);
  const [recentBadges, setRecentBadges] = useState<Badge[]>([]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setResult(loadResult());
    try {
      const raw = window.sessionStorage.getItem("typefly-recent-badges");
      if (raw) {
        setRecentBadges(JSON.parse(raw));
        // Clear after reading so it only shows once
        window.sessionStorage.removeItem("typefly-recent-badges");
      }
    } catch {
      /* ignore */
    }
  }, []);

  const tier = result ? getSpeedTier(result.wpm) : null;

  function copyScore() {
    if (!result) return;
    const text = `🐦 TypeFly Flight: ${result.wpm} WPM | ${result.accuracy}% Accuracy | ${result.bestCombo}x Max Combo! Can you beat my flight? https://ai.studio/build`;
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-3xl px-4 py-10">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Flight Results</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {result?.mode === "bird" ? "Typing Bird Flappy Flight" : "Beginner Mode Practice"}
            </p>
          </div>
          {result && (
            <button onClick={copyScore} className="btn-ghost text-xs">
              {copied ? "Copied to clipboard! ✓" : "Share Score 📋"}
            </button>
          )}
        </div>

        {!result ? (
          <div className="panel mt-6 p-10 text-center">
            <img
              src={birdImg}
              alt="TypeFly bird"
              width={96}
              height={96}
              className="mx-auto h-20 w-20 animate-float opacity-60"
            />
            <p className="mt-4 text-muted-foreground">
              No recent flight recorded. Take to the skies!
            </p>
            <Link to="/play" className="btn-primary mt-5 inline-block">
              Play Typing Bird
            </Link>
          </div>
        ) : (
          <>
            {/* New Milestones Unlocked Banner */}
            {recentBadges.length > 0 && (
              <div className="mt-6 rounded-2xl border-2 border-amber-400/80 bg-gradient-to-r from-amber-500/15 via-primary/10 to-amber-500/15 p-4 shadow-lg shadow-amber-500/10">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-background/80 text-2xl shadow-inner animate-bounce">
                      🏆
                    </span>
                    <div>
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide text-amber-700 dark:text-amber-300">
                        <Sparkles className="h-3 w-3" />
                        Milestone Unlocked!
                      </span>
                      <p className="font-display text-lg font-extrabold text-foreground">
                        {recentBadges.map((b) => b.name).join(" • ")}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {recentBadges[0]?.description}
                      </p>
                    </div>
                  </div>
                  <Link
                    to="/profile"
                    className="btn-primary text-xs flex items-center gap-1.5 shadow"
                  >
                    <Award className="h-3.5 w-3.5" />
                    View in Profile →
                  </Link>
                </div>
              </div>
            )}

            <div className="panel mt-6 flex flex-wrap items-center gap-6 p-6 sm:p-8">
              <img
                src={birdImg}
                alt="Bird mascot celebrating"
                width={140}
                height={140}
                loading="lazy"
                className="h-24 w-24 sm:h-28 sm:w-28 animate-float"
              />
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-display text-5xl sm:text-6xl font-extrabold text-primary">
                    {result.wpm}
                  </span>
                  <div>
                    <p className="font-bold uppercase tracking-wider text-xs text-muted-foreground">
                      WORDS PER MINUTE
                    </p>
                    <span className="inline-block rounded-full bg-primary/15 px-2.5 py-0.5 text-xs font-extrabold text-primary">
                      {tier?.title}
                    </span>
                  </div>
                </div>
                <p className="mt-3 font-medium text-foreground text-sm sm:text-base">
                  {performanceSummary(result.wpm, result.accuracy)}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{tier?.desc}</p>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Cell
                label="Accuracy"
                value={`${result.accuracy}%`}
                sub={
                  result.accuracy >= 95
                    ? "Pristine!"
                    : result.accuracy >= 90
                      ? "Great flow"
                      : "Focus on precision"
                }
              />
              <Cell
                label="Mistakes"
                value={String(result.errors)}
                sub={result.errors === 0 ? "Flawless run" : "Keystroke slips"}
              />
              <Cell label="Characters" value={String(result.characters)} sub="Keys nailed" />
              <Cell label="Words Completed" value={String(result.words)} sub="Flight passages" />
              <Cell label="Best Streak" value={`x${result.bestCombo}`} sub="Max consecutive keys" />
              <Cell
                label="Flight Time"
                value={formatDuration(result.durationSeconds)}
                sub={
                  result.livesLeft > 0 ? `${"❤️".repeat(result.livesLeft)} left` : "Out of lives"
                }
              />
            </div>

            {/* Profile status prompt */}
            <div className="mt-4 flex flex-wrap items-center justify-between rounded-xl border border-border bg-card/60 p-4 text-xs">
              <span className="text-muted-foreground">
                {user ? (
                  <span className="font-medium text-foreground">
                    ✓ Flight saved to your profile ({user.email}).
                  </span>
                ) : (
                  <span>
                    Sign in to save your personal bests, flight history, and streak records.
                  </span>
                )}
              </span>
              {user ? (
                <Link to="/profile" className="font-bold text-primary underline">
                  View Career Stats →
                </Link>
              ) : (
                <Link to="/auth" className="font-bold text-primary underline">
                  Sign in / Register
                </Link>
              )}
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/play" className="btn-primary">
                Fly again
              </Link>
              <Link to="/beginner" className="btn-ghost">
                Practice in Beginner Mode
              </Link>
              <Link to="/profile" className="btn-ghost">
                Profile & Records
              </Link>
              <Link to="/pricing" className="btn-accent">
                Go Premium ✨
              </Link>
            </div>
          </>
        )}
      </div>
    </SiteLayout>
  );
}

function Cell({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="panel p-4 text-center">
      <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-2xl font-extrabold">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

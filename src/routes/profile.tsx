import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { getUserStats, loadHistory, type TestResult } from "@/lib/results";
import { BadgesSection } from "@/components/BadgesSection";
import { getAllBadgesWithStatus } from "@/lib/badges";
import birdImg from "@/assets/bird.png";
import { Award, LogIn, Sparkles, UserCheck } from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Your TypeFly Profile & Flight Stats" },
      {
        name: "description",
        content: "Track your typing progress, best WPM, accuracy, combos, and past flights.",
      },
      { property: "og:title", content: "Your TypeFly Profile & Flight Stats" },
      {
        property: "og:description",
        content: "Track your typing progress, best WPM, accuracy, combos, and past flights.",
      },
    ],
  }),
  component: ProfilePage,
});

type Profile = { display_name: string | null; is_premium: boolean };

function ProfilePage() {
  const { user, loading, signOut } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [history, setHistory] = useState<TestResult[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
  }, []);

  useEffect(() => {
    if (!user) return;
    void (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("display_name, is_premium")
        .eq("id", user.id)
        .maybeSingle();
      if (data) {
        setProfile(data);
        setName(data.display_name ?? "");
      } else {
        const fallback =
          (user.user_metadata?.["display_name"] as string) ?? user.email?.split("@")[0] ?? "Flyer";
        await supabase.from("profiles").upsert({ id: user.id, display_name: fallback });
        setProfile({ display_name: fallback, is_premium: false });
        setName(fallback);
      }
    })();
  }, [user]);

  const stats = getUserStats(history);
  const { earnedCount, totalCount } = useMemo(() => getAllBadgesWithStatus(history), [history]);

  if (loading) {
    return (
      <SiteLayout>
        <p className="p-10 text-center text-muted-foreground">Loading flight records…</p>
      </SiteLayout>
    );
  }

  // If not logged in and no local flights exist, show sign-in prompt
  if (!user && history.length === 0) {
    return (
      <SiteLayout>
        <div className="mx-auto max-w-md px-4 py-16 text-center">
          <img
            src={birdImg}
            alt="TypeFly bird"
            width={80}
            height={80}
            className="mx-auto h-20 w-20 animate-float"
          />
          <h1 className="mt-4 font-display text-2xl font-extrabold">
            Sign in to view your profile
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Save your WPM records, track combos, earn milestone badges, and keep your full flight
            history.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link to="/auth" className="btn-primary">
              Sign in / Register
            </Link>
            <Link to="/play" className="btn-ghost">
              Play as Guest
            </Link>
          </div>
        </div>
      </SiteLayout>
    );
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-4xl px-4 py-10">
        {/* Guest Banner if not signed in */}
        {!user && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-primary/30 bg-primary/10 p-4 text-sm">
            <div className="flex items-center gap-2.5">
              <span className="text-xl">🪶</span>
              <div>
                <p className="font-bold text-foreground">Guest Aviator Mode</p>
                <p className="text-xs text-muted-foreground">
                  Your badges, words typed, and flight stats are currently saved in this browser.
                </p>
              </div>
            </div>
            <Link to="/auth" className="btn-primary text-xs flex items-center gap-1.5">
              <LogIn className="h-3.5 w-3.5" />
              Sign in to Cloud Sync
            </Link>
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <img
              src={birdImg}
              alt="Aviator mascot"
              width={72}
              height={72}
              className="h-16 w-16 animate-float"
            />
            <div>
              <h1 className="font-display text-3xl font-extrabold">
                {user ? profile?.display_name || name || "Aviator" : "Guest Aviator"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {user ? user.email : "Local pilot session on this device"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span
              className={`rounded-full px-3 py-1 text-xs font-bold ${
                profile?.is_premium
                  ? "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {profile?.is_premium ? "✨ Premium Aviator" : user ? "Free Plan" : "Guest Pilot"}
            </span>
            {user ? (
              <button onClick={signOut} className="btn-ghost text-xs">
                Sign out
              </button>
            ) : (
              <Link to="/auth" className="btn-ghost text-xs">
                Sign in
              </Link>
            )}
          </div>
        </div>

        {/* Career Stats Grid */}
        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
          <StatCard label="Best Speed" value={`${stats.bestWpm} WPM`} highlight />
          <StatCard label="Avg Accuracy" value={`${stats.averageAccuracy}%`} />
          <StatCard label="Highest Combo" value={`x${stats.bestCombo}`} />
          <StatCard label="Words Typed" value={stats.totalWords.toLocaleString()} />
          <StatCard label="Badges Earned" value={`${earnedCount} / ${totalCount}`} highlight />
        </div>

        {/* Lifetime Badges & Milestones Section */}
        <BadgesSection history={history} />

        {/* Profile Settings Panel (only for signed-in users) */}
        {user && (
          <div className="panel mt-8 p-6">
            <h2 className="font-display text-xl font-bold">Pilot Settings</h2>
            <div className="mt-4 flex flex-wrap items-end gap-3">
              <label className="flex-1 min-w-[200px] text-sm font-bold">
                Display name
                <input
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setSaved(false);
                  }}
                  className="mt-1 w-full rounded-xl border-2 border-input bg-muted px-3 py-2 outline-none focus:border-primary"
                />
              </label>
              <button
                onClick={async () => {
                  await supabase.from("profiles").upsert({ id: user.id, display_name: name });
                  setSaved(true);
                }}
                className="btn-primary"
              >
                Save Name
              </button>
            </div>
            {saved && <p className="mt-2 text-sm font-bold text-green-600">Saved successfully!</p>}

            {!profile?.is_premium && (
              <div className="mt-4 flex items-center justify-between rounded-xl bg-accent/30 p-3 text-sm">
                <span>Ready for custom flight lengths and unlimited lessons?</span>
                <Link to="/pricing" className="btn-accent text-xs">
                  Unlock Premium
                </Link>
              </div>
            )}
          </div>
        )}

        {/* Flight History */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Flight History</h2>
            <Link to="/play" className="btn-primary text-xs">
              New Flight
            </Link>
          </div>

          {history.length === 0 ? (
            <div className="panel mt-4 p-8 text-center">
              <p className="text-muted-foreground">No flights recorded yet.</p>
              <Link to="/play" className="btn-primary mt-3 inline-block">
                Take your first flight
              </Link>
            </div>
          ) : (
            <div className="panel mt-4 overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50 text-xs font-bold uppercase text-muted-foreground">
                    <th className="p-3">Mode</th>
                    <th className="p-3">Speed</th>
                    <th className="p-3">Accuracy</th>
                    <th className="p-3">Combo</th>
                    <th className="p-3">Errors</th>
                    <th className="p-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {history.map((item, idx) => (
                    <tr key={idx} className="hover:bg-muted/30">
                      <td className="p-3 font-bold">
                        {item.mode === "bird" ? "🐦 Typing Bird" : "🌱 Beginner"}
                      </td>
                      <td className="p-3 font-mono font-bold text-primary">{item.wpm} WPM</td>
                      <td className="p-3">{item.accuracy}%</td>
                      <td className="p-3">x{item.bestCombo}</td>
                      <td className="p-3 text-muted-foreground">{item.errors}</td>
                      <td className="p-3 text-xs text-muted-foreground">
                        {new Date(item.finishedAt).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function StatCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className={`panel p-4 text-center ${highlight ? "border-primary/50" : ""}`}>
      <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-display text-2xl font-extrabold ${highlight ? "text-primary" : ""}`}>
        {value}
      </p>
    </div>
  );
}

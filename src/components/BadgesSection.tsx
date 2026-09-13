import { useMemo, useState } from "react";
import {
  type BadgeCategory,
  type BadgeWithStatus,
  getAllBadgesWithStatus,
  getTierColor,
} from "@/lib/badges";
import type { TestResult } from "@/lib/results";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Award, CheckCircle2, Lock, Share2, Sparkles } from "lucide-react";

type FilterStatus = "all" | "earned" | "locked";
type FilterCategory = "all" | BadgeCategory;

interface BadgesSectionProps {
  history: TestResult[];
}

export function BadgesSection({ history }: BadgesSectionProps) {
  const [statusFilter, setStatusFilter] = useState<FilterStatus>("all");
  const [categoryFilter, setCategoryFilter] = useState<FilterCategory>("all");
  const [selectedBadge, setSelectedBadge] = useState<BadgeWithStatus | null>(null);
  const [copied, setCopied] = useState(false);

  const { badges, stats, earnedCount, totalCount } = useMemo(
    () => getAllBadgesWithStatus(history),
    [history],
  );

  const filteredBadges = useMemo(() => {
    return badges.filter((badge) => {
      // Status filter
      if (statusFilter === "earned" && !badge.isEarned) return false;
      if (statusFilter === "locked" && badge.isEarned) return false;

      // Category filter
      if (categoryFilter !== "all" && badge.category !== categoryFilter) return false;

      return true;
    });
  }, [badges, statusFilter, categoryFilter]);

  const percentageUnlocked = totalCount > 0 ? Math.round((earnedCount / totalCount) * 100) : 0;

  function handleShareBadge(badge: BadgeWithStatus) {
    const text = badge.isEarned
      ? `🏆 I just earned the "${badge.name}" badge on TypeFly! (${badge.description}) Can you beat my flight records? https://ai.studio/build`
      : `🎯 Currently working towards "${badge.name}" on TypeFly: ${badge.progress.current}/${badge.progress.max} ${badge.unit} completed (${badge.progress.percentage}%)!`;

    if (navigator?.clipboard) {
      void navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  }

  return (
    <section className="mt-8">
      {/* Section Header */}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl text-foreground">
              Pilot Badges & Milestones
            </h2>
            <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-extrabold text-primary">
              <Award className="h-3.5 w-3.5" />
              {earnedCount} / {totalCount} Earned
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Track your lifetime achievements across flights, from typing 1,000 words to flawless
            perfect accuracy runs.
          </p>
        </div>

        {/* Global Progress Gauge */}
        <div className="w-full sm:w-64">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-muted-foreground">Flight Mastery</span>
            <span className="text-primary">{percentageUnlocked}% Complete</span>
          </div>
          <div className="mt-1.5 h-2.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-primary transition-all duration-500 rounded-full"
              style={{ width: `${percentageUnlocked}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lifetime Cumulative Highlights */}
      <div className="mt-4 grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <div className="rounded-xl border border-border/80 bg-card/60 p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Lifetime Words Typed
          </p>
          <p className="mt-0.5 font-display text-xl font-extrabold text-primary">
            {stats.totalWords.toLocaleString()}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {stats.totalWords >= 1000
              ? "✓ 1000+ Words milestone unlocked!"
              : `${1000 - stats.totalWords} words to 1000 Words Typed`}
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Perfect Accuracy Sessions
          </p>
          <p className="mt-0.5 font-display text-xl font-extrabold text-foreground">
            {stats.perfectSessions}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {stats.perfectSessions > 0 ? "100% accuracy runs" : "Fly with 0 typos to earn"}
          </p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Max Key Streak
          </p>
          <p className="mt-0.5 font-display text-xl font-extrabold text-foreground">
            x{stats.highestCombo}
          </p>
          <p className="text-[10px] text-muted-foreground">Consecutive correct keystrokes</p>
        </div>

        <div className="rounded-xl border border-border/80 bg-card/60 p-3 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
            Total Flight Time
          </p>
          <p className="mt-0.5 font-display text-xl font-extrabold text-foreground">
            {Math.floor(stats.totalDurationSeconds / 60)}m {stats.totalDurationSeconds % 60}s
          </p>
          <p className="text-[10px] text-muted-foreground">{stats.totalFlights} flights logged</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-b border-border pb-3">
        {/* Status Filters */}
        <div className="flex flex-wrap gap-1.5">
          <button
            onClick={() => setStatusFilter("all")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
              statusFilter === "all"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            All ({totalCount})
          </button>
          <button
            onClick={() => setStatusFilter("earned")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${
              statusFilter === "earned"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <CheckCircle2 className="h-3 w-3" />
            Earned ({earnedCount})
          </button>
          <button
            onClick={() => setStatusFilter("locked")}
            className={`rounded-lg px-3 py-1.5 text-xs font-bold transition-colors flex items-center gap-1 ${
              statusFilter === "locked"
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            <Lock className="h-3 w-3" />
            In Progress ({totalCount - earnedCount})
          </button>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-1 text-xs">
          {(
            [
              { id: "all", label: "All Types" },
              { id: "words", label: "💬 Words" },
              { id: "accuracy", label: "🎯 Accuracy" },
              { id: "speed", label: "⚡ Speed" },
              { id: "streak", label: "🪶 Combos" },
              { id: "flights", label: "✈️ Flights" },
            ] as const
          ).map((cat) => (
            <button
              key={cat.id}
              onClick={() => setCategoryFilter(cat.id)}
              className={`rounded-md px-2.5 py-1 font-semibold transition-colors ${
                categoryFilter === cat.id
                  ? "bg-accent text-accent-foreground font-bold"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Badges Grid */}
      {filteredBadges.length === 0 ? (
        <div className="panel mt-4 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            No badges match the selected filter criteria.
          </p>
          <button
            onClick={() => {
              setStatusFilter("all");
              setCategoryFilter("all");
            }}
            className="btn-ghost mt-3 text-xs"
          >
            Reset filters
          </button>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filteredBadges.map((badge) => {
            const tierStyle = getTierColor(badge.tier);
            const isEarned = badge.isEarned;

            return (
              <div
                key={badge.id}
                onClick={() => setSelectedBadge(badge)}
                className={`group relative flex flex-col justify-between rounded-2xl border-2 p-4 transition-all duration-200 cursor-pointer ${
                  isEarned
                    ? `${tierStyle.border} ${tierStyle.bg} ${tierStyle.glow} hover:-translate-y-0.5 hover:shadow-lg`
                    : "border-border/60 bg-card/40 opacity-75 hover:opacity-100 hover:border-border"
                }`}
              >
                <div>
                  {/* Top Bar: Icon + Tier Chip + Status */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-2xl shadow-inner ${
                          isEarned ? "bg-background/80" : "bg-muted/80 grayscale"
                        }`}
                      >
                        {badge.icon}
                      </div>
                      <div>
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wide ${tierStyle.badge}`}
                        >
                          {badge.tier}
                        </span>
                        <h3 className="font-display text-base font-extrabold text-foreground leading-snug">
                          {badge.name}
                        </h3>
                      </div>
                    </div>

                    {isEarned ? (
                      <span className="flex items-center gap-1 rounded-full bg-green-500/15 px-2 py-0.5 text-[11px] font-bold text-green-600 dark:text-green-400">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Earned
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">
                        <Lock className="h-3 w-3" />
                        Locked
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <p className="mt-2.5 text-xs text-muted-foreground leading-relaxed">
                    {badge.description}
                  </p>
                </div>

                {/* Bottom Status / Progress Indicator */}
                <div className="mt-4 border-t border-border/40 pt-3">
                  {isEarned ? (
                    <div className="flex items-center justify-between text-[11px] font-medium text-muted-foreground">
                      <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                        <Sparkles className="h-3 w-3" /> Milestone achieved!
                      </span>
                      {badge.unlockedAt && (
                        <span>
                          {new Date(badge.unlockedAt).toLocaleDateString(undefined, {
                            month: "short",
                            day: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                  ) : (
                    <div>
                      <div className="flex justify-between text-[11px] font-semibold text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span className="font-mono">
                          {badge.progress.current.toLocaleString()} /{" "}
                          {badge.progress.max.toLocaleString()} {badge.unit} (
                          {badge.progress.percentage}%)
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-primary/75 rounded-full transition-all duration-300"
                          style={{ width: `${badge.progress.percentage}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Badge Detail Modal */}
      {selectedBadge && (
        <Dialog open={Boolean(selectedBadge)} onOpenChange={() => setSelectedBadge(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-muted text-4xl shadow-inner mb-2">
                {selectedBadge.icon}
              </div>
              <div className="text-center">
                <span
                  className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-extrabold uppercase tracking-wide mb-1 ${
                    getTierColor(selectedBadge.tier).badge
                  }`}
                >
                  {selectedBadge.tier} Tier Milestone
                </span>
                <DialogTitle className="font-display text-2xl font-extrabold">
                  {selectedBadge.name}
                </DialogTitle>
                <DialogDescription className="mt-1.5 text-sm text-muted-foreground">
                  {selectedBadge.description}
                </DialogDescription>
              </div>
            </DialogHeader>

            <div className="mt-4 space-y-3 rounded-xl border border-border bg-card/60 p-4 text-sm">
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Status</span>
                {selectedBadge.isEarned ? (
                  <span className="flex items-center gap-1 font-bold text-green-600 dark:text-green-400">
                    <CheckCircle2 className="h-4 w-4" /> Unlocked & Earned
                  </span>
                ) : (
                  <span className="flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                    <Lock className="h-4 w-4" /> In Progress
                  </span>
                )}
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Requirement</span>
                <span className="font-bold text-foreground">
                  {selectedBadge.target.toLocaleString()} {selectedBadge.unit}
                </span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-muted-foreground font-medium">Current Progress</span>
                <span className="font-mono font-bold text-primary">
                  {selectedBadge.progress.current.toLocaleString()} /{" "}
                  {selectedBadge.progress.max.toLocaleString()} ({selectedBadge.progress.percentage}
                  %)
                </span>
              </div>

              {selectedBadge.unlockedAt && (
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground font-medium">Date Unlocked</span>
                  <span className="text-foreground font-semibold">
                    {new Date(selectedBadge.unlockedAt).toLocaleDateString(undefined, {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </span>
                </div>
              )}

              {/* Progress bar */}
              <div className="pt-1">
                <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      selectedBadge.isEarned ? "bg-green-500" : "bg-primary"
                    }`}
                    style={{ width: `${selectedBadge.progress.percentage}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="mt-4 flex gap-2">
              <button
                onClick={() => handleShareBadge(selectedBadge)}
                className="btn-primary flex-1 text-sm flex items-center justify-center gap-2"
              >
                <Share2 className="h-4 w-4" />
                {copied ? "Copied to Clipboard! ✓" : "Share Badge"}
              </button>
              <button onClick={() => setSelectedBadge(null)} className="btn-ghost text-sm">
                Close
              </button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </section>
  );
}

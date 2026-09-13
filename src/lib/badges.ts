import type { TestResult } from "@/lib/results";

export type BadgeCategory = "words" | "accuracy" | "speed" | "streak" | "flights";
export type BadgeTier = "bronze" | "silver" | "gold" | "diamond";

export type Badge = {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  tier: BadgeTier;
  icon: string;
  target: number;
  unit: string;
  getProgress: (stats: LifetimeStats) => { current: number; max: number; percentage: number };
  isEarned: (stats: LifetimeStats) => boolean;
};

export type LifetimeStats = {
  totalFlights: number;
  totalWords: number;
  totalCharacters: number;
  totalDurationSeconds: number;
  bestWpm: number;
  highestCombo: number;
  perfectSessions: number; // 100% accuracy sessions
  highAccuracySessions: number; // 98%+ sessions
  flawlessSessions: number; // 0 errors
  speedRuns60Plus: number;
  speedRuns80Plus: number;
};

export type BadgeWithStatus = Badge & {
  isEarned: boolean;
  progress: {
    current: number;
    max: number;
    percentage: number;
  };
  unlockedAt: string | null;
};

const BADGES_STORAGE_KEY = "typefly-earned-badges";
const LIFETIME_STATS_KEY = "typefly-lifetime-accumulated";

export const BADGE_DEFINITIONS: Badge[] = [
  // 1. Lifetime Words Milestones
  {
    id: "words-25",
    name: "First Words",
    description: "Type your first 25 words in flight.",
    category: "words",
    tier: "bronze",
    icon: "💬",
    target: 25,
    unit: "words",
    getProgress: (s) => ({
      current: Math.min(s.totalWords, 25),
      max: 25,
      percentage: Math.min(100, Math.round((s.totalWords / 25) * 100)),
    }),
    isEarned: (s) => s.totalWords >= 25,
  },
  {
    id: "words-100",
    name: "Century Aviator",
    description: "Type 100 lifetime words across all flights.",
    category: "words",
    tier: "bronze",
    icon: "📜",
    target: 100,
    unit: "words",
    getProgress: (s) => ({
      current: Math.min(s.totalWords, 100),
      max: 100,
      percentage: Math.min(100, Math.round((s.totalWords / 100) * 100)),
    }),
    isEarned: (s) => s.totalWords >= 100,
  },
  {
    id: "words-500",
    name: "Word Navigator",
    description: "Type 500 lifetime words across your flights.",
    category: "words",
    tier: "silver",
    icon: "🧭",
    target: 500,
    unit: "words",
    getProgress: (s) => ({
      current: Math.min(s.totalWords, 500),
      max: 500,
      percentage: Math.min(100, Math.round((s.totalWords / 500) * 100)),
    }),
    isEarned: (s) => s.totalWords >= 500,
  },
  {
    id: "words-1000",
    name: "1000 Words Typed",
    description: "Reach the 1,000 lifetime words milestone in the skies.",
    category: "words",
    tier: "gold",
    icon: "📚",
    target: 1000,
    unit: "words",
    getProgress: (s) => ({
      current: Math.min(s.totalWords, 1000),
      max: 1000,
      percentage: Math.min(100, Math.round((s.totalWords / 1000) * 100)),
    }),
    isEarned: (s) => s.totalWords >= 1000,
  },
  {
    id: "words-2500",
    name: "Sky Lexicon",
    description: "Accumulate 2,500 lifetime words typed.",
    category: "words",
    tier: "gold",
    icon: "🚀",
    target: 2500,
    unit: "words",
    getProgress: (s) => ({
      current: Math.min(s.totalWords, 2500),
      max: 2500,
      percentage: Math.min(100, Math.round((s.totalWords / 2500) * 100)),
    }),
    isEarned: (s) => s.totalWords >= 2500,
  },
  {
    id: "words-5000",
    name: "Lexicon Legend",
    description: "Type 5,000 words lifetime — a true master of the keyboard.",
    category: "words",
    tier: "diamond",
    icon: "👑",
    target: 5000,
    unit: "words",
    getProgress: (s) => ({
      current: Math.min(s.totalWords, 5000),
      max: 5000,
      percentage: Math.min(100, Math.round((s.totalWords / 5000) * 100)),
    }),
    isEarned: (s) => s.totalWords >= 5000,
  },

  // 2. Accuracy Milestones
  {
    id: "perfect-accuracy-session",
    name: "Perfect Accuracy Session",
    description: "Complete a flight session with 100% accuracy and zero mistakes.",
    category: "accuracy",
    tier: "gold",
    icon: "🎯",
    target: 1,
    unit: "session",
    getProgress: (s) => ({
      current: Math.min(s.perfectSessions, 1),
      max: 1,
      percentage: s.perfectSessions >= 1 ? 100 : 0,
    }),
    isEarned: (s) => s.perfectSessions >= 1,
  },
  {
    id: "flawless-triple",
    name: "Flawless Triple",
    description: "Complete 3 separate flight sessions with 100% perfect accuracy.",
    category: "accuracy",
    tier: "diamond",
    icon: "💎",
    target: 3,
    unit: "sessions",
    getProgress: (s) => ({
      current: Math.min(s.perfectSessions, 3),
      max: 3,
      percentage: Math.min(100, Math.round((s.perfectSessions / 3) * 100)),
    }),
    isEarned: (s) => s.perfectSessions >= 3,
  },
  {
    id: "precision-marksman",
    name: "Precision Marksman",
    description: "Finish 5 flight sessions with 98% or higher accuracy.",
    category: "accuracy",
    tier: "silver",
    icon: "🏹",
    target: 5,
    unit: "sessions",
    getProgress: (s) => ({
      current: Math.min(s.highAccuracySessions, 5),
      max: 5,
      percentage: Math.min(100, Math.round((s.highAccuracySessions / 5) * 100)),
    }),
    isEarned: (s) => s.highAccuracySessions >= 5,
  },
  {
    id: "clean-sheet",
    name: "Zero Typos Run",
    description: "Finish a complete flight without making a single error.",
    category: "accuracy",
    tier: "bronze",
    icon: "✨",
    target: 1,
    unit: "session",
    getProgress: (s) => ({
      current: Math.min(s.flawlessSessions, 1),
      max: 1,
      percentage: s.flawlessSessions >= 1 ? 100 : 0,
    }),
    isEarned: (s) => s.flawlessSessions >= 1,
  },

  // 3. Speed Milestones (WPM)
  {
    id: "speed-30",
    name: "Gliding Sparrow",
    description: "Achieve 30+ WPM in a flight session.",
    category: "speed",
    tier: "bronze",
    icon: "🐣",
    target: 30,
    unit: "WPM",
    getProgress: (s) => ({
      current: Math.min(s.bestWpm, 30),
      max: 30,
      percentage: Math.min(100, Math.round((s.bestWpm / 30) * 100)),
    }),
    isEarned: (s) => s.bestWpm >= 30,
  },
  {
    id: "speed-50",
    name: "Swift Falcon",
    description: "Achieve 50+ WPM in a flight session.",
    category: "speed",
    tier: "silver",
    icon: "⚡",
    target: 50,
    unit: "WPM",
    getProgress: (s) => ({
      current: Math.min(s.bestWpm, 50),
      max: 50,
      percentage: Math.min(100, Math.round((s.bestWpm / 50) * 100)),
    }),
    isEarned: (s) => s.bestWpm >= 50,
  },
  {
    id: "speed-75",
    name: "Sonic Skylark",
    description: "Reach an exhilarating 75+ WPM flight speed.",
    category: "speed",
    tier: "gold",
    icon: "🔥",
    target: 75,
    unit: "WPM",
    getProgress: (s) => ({
      current: Math.min(s.bestWpm, 75),
      max: 75,
      percentage: Math.min(100, Math.round((s.bestWpm / 75) * 100)),
    }),
    isEarned: (s) => s.bestWpm >= 75,
  },
  {
    id: "speed-100",
    name: "Sky Sovereign",
    description: "Break 100+ WPM — outspeeding the fastest birds.",
    category: "speed",
    tier: "diamond",
    icon: "🏆",
    target: 100,
    unit: "WPM",
    getProgress: (s) => ({
      current: Math.min(s.bestWpm, 100),
      max: 100,
      percentage: Math.min(100, Math.round((s.bestWpm / 100) * 100)),
    }),
    isEarned: (s) => s.bestWpm >= 100,
  },

  // 4. Streak / Combo Milestones
  {
    id: "streak-25",
    name: "Steady Wing",
    description: "Keep a streak of 25 consecutive correct keys.",
    category: "streak",
    tier: "bronze",
    icon: "🪶",
    target: 25,
    unit: "combo",
    getProgress: (s) => ({
      current: Math.min(s.highestCombo, 25),
      max: 25,
      percentage: Math.min(100, Math.round((s.highestCombo / 25) * 100)),
    }),
    isEarned: (s) => s.highestCombo >= 25,
  },
  {
    id: "streak-50",
    name: "Flow State",
    description: "Reach a 50-key uninterrupted combo streak.",
    category: "streak",
    tier: "silver",
    icon: "🌊",
    target: 50,
    unit: "combo",
    getProgress: (s) => ({
      current: Math.min(s.highestCombo, 50),
      max: 50,
      percentage: Math.min(100, Math.round((s.highestCombo / 50) * 100)),
    }),
    isEarned: (s) => s.highestCombo >= 50,
  },
  {
    id: "streak-100",
    name: "Unbroken Horizon",
    description: "Hit a phenomenal 100-key combo streak without a slip.",
    category: "streak",
    tier: "gold",
    icon: "⚡",
    target: 100,
    unit: "combo",
    getProgress: (s) => ({
      current: Math.min(s.highestCombo, 100),
      max: 100,
      percentage: Math.min(100, Math.round((s.highestCombo / 100) * 100)),
    }),
    isEarned: (s) => s.highestCombo >= 100,
  },

  // 5. Flights & Endurance Milestones
  {
    id: "maiden-voyage",
    name: "Maiden Voyage",
    description: "Complete your very first typing flight.",
    category: "flights",
    tier: "bronze",
    icon: "🛫",
    target: 1,
    unit: "flight",
    getProgress: (s) => ({
      current: Math.min(s.totalFlights, 1),
      max: 1,
      percentage: s.totalFlights >= 1 ? 100 : 0,
    }),
    isEarned: (s) => s.totalFlights >= 1,
  },
  {
    id: "flights-10",
    name: "Frequent Flyer",
    description: "Log 10 completed flight sessions in your flight log.",
    category: "flights",
    tier: "silver",
    icon: "✈️",
    target: 10,
    unit: "flights",
    getProgress: (s) => ({
      current: Math.min(s.totalFlights, 10),
      max: 10,
      percentage: Math.min(100, Math.round((s.totalFlights / 10) * 100)),
    }),
    isEarned: (s) => s.totalFlights >= 10,
  },
  {
    id: "flights-25",
    name: "Veteran Aviator",
    description: "Complete 25 flight sessions across your typing career.",
    category: "flights",
    tier: "gold",
    icon: "🎖️",
    target: 25,
    unit: "flights",
    getProgress: (s) => ({
      current: Math.min(s.totalFlights, 25),
      max: 25,
      percentage: Math.min(100, Math.round((s.totalFlights / 25) * 100)),
    }),
    isEarned: (s) => s.totalFlights >= 25,
  },
  {
    id: "airtime-10m",
    name: "Endurance Ace",
    description: "Log over 10 minutes (600 seconds) of total flight time.",
    category: "flights",
    tier: "gold",
    icon: "⏱️",
    target: 600,
    unit: "seconds",
    getProgress: (s) => ({
      current: Math.min(s.totalDurationSeconds, 600),
      max: 600,
      percentage: Math.min(100, Math.round((s.totalDurationSeconds / 600) * 100)),
    }),
    isEarned: (s) => s.totalDurationSeconds >= 600,
  },
];

/**
 * Load raw accumulated lifetime stats from storage, or fallback to zeroed stats
 */
export function loadAccumulatedStats(): LifetimeStats {
  const zeroStats: LifetimeStats = {
    totalFlights: 0,
    totalWords: 0,
    totalCharacters: 0,
    totalDurationSeconds: 0,
    bestWpm: 0,
    highestCombo: 0,
    perfectSessions: 0,
    highAccuracySessions: 0,
    flawlessSessions: 0,
    speedRuns60Plus: 0,
    speedRuns80Plus: 0,
  };

  if (typeof window === "undefined") return zeroStats;

  try {
    const raw = window.localStorage.getItem(LIFETIME_STATS_KEY);
    return raw ? { ...zeroStats, ...JSON.parse(raw) } : zeroStats;
  } catch {
    return zeroStats;
  }
}

/**
 * Calculate reconciled lifetime stats by combining accumulated storage
 * and any history records to ensure no past games are ever missed.
 */
export function calculateLifetimeStats(history: TestResult[]): LifetimeStats {
  const accumulated = loadAccumulatedStats();

  // Aggregate stats strictly from the current history list
  const historyFlights = history.length;
  const historyWords = history.reduce((sum, h) => sum + (h.words || 0), 0);
  const historyChars = history.reduce((sum, h) => sum + (h.characters || 0), 0);
  const historyDuration = history.reduce((sum, h) => sum + (h.durationSeconds || 0), 0);
  const historyBestWpm = history.length > 0 ? Math.max(...history.map((h) => h.wpm || 0)) : 0;
  const historyBestCombo =
    history.length > 0 ? Math.max(...history.map((h) => h.bestCombo || 0)) : 0;
  const historyPerfect = history.filter(
    (h) => h.accuracy === 100 && (h.errors === 0 || h.errors === undefined),
  ).length;
  const historyHighAcc = history.filter((h) => h.accuracy >= 98).length;
  const historyFlawless = history.filter((h) => (h.errors ?? 0) === 0).length;
  const history60 = history.filter((h) => h.wpm >= 60).length;
  const history80 = history.filter((h) => h.wpm >= 80).length;

  return {
    totalFlights: Math.max(accumulated.totalFlights, historyFlights),
    totalWords: Math.max(accumulated.totalWords, historyWords),
    totalCharacters: Math.max(accumulated.totalCharacters, historyChars),
    totalDurationSeconds: Math.max(accumulated.totalDurationSeconds, historyDuration),
    bestWpm: Math.max(accumulated.bestWpm, historyBestWpm),
    highestCombo: Math.max(accumulated.highestCombo, historyBestCombo),
    perfectSessions: Math.max(accumulated.perfectSessions, historyPerfect),
    highAccuracySessions: Math.max(accumulated.highAccuracySessions, historyHighAcc),
    flawlessSessions: Math.max(accumulated.flawlessSessions, historyFlawless),
    speedRuns60Plus: Math.max(accumulated.speedRuns60Plus, history60),
    speedRuns80Plus: Math.max(accumulated.speedRuns80Plus, history80),
  };
}

/**
 * Record a new session into lifetime stats and return any newly unlocked badges
 */
export function recordSessionForBadges(result: TestResult, history: TestResult[]): Badge[] {
  if (typeof window === "undefined") return [];

  // Update accumulated stats
  const current = calculateLifetimeStats(history);
  const isPerfect = result.accuracy === 100 && result.errors === 0;
  const isHighAcc = result.accuracy >= 98;
  const isFlawless = result.errors === 0;

  const updated: LifetimeStats = {
    totalFlights: current.totalFlights + 1,
    totalWords: current.totalWords + (result.words || 0),
    totalCharacters: current.totalCharacters + (result.characters || 0),
    totalDurationSeconds: current.totalDurationSeconds + (result.durationSeconds || 0),
    bestWpm: Math.max(current.bestWpm, result.wpm || 0),
    highestCombo: Math.max(current.highestCombo, result.bestCombo || 0),
    perfectSessions: current.perfectSessions + (isPerfect ? 1 : 0),
    highAccuracySessions: current.highAccuracySessions + (isHighAcc ? 1 : 0),
    flawlessSessions: current.flawlessSessions + (isFlawless ? 1 : 0),
    speedRuns60Plus: current.speedRuns60Plus + (result.wpm >= 60 ? 1 : 0),
    speedRuns80Plus: current.speedRuns80Plus + (result.wpm >= 80 ? 1 : 0),
  };

  try {
    window.localStorage.setItem(LIFETIME_STATS_KEY, JSON.stringify(updated));
  } catch {
    /* ignore */
  }

  // Check which badges are unlocked now vs previously
  const earnedMap = loadEarnedBadgesMap();
  const newlyEarned: Badge[] = [];
  const now = new Date().toISOString();

  BADGE_DEFINITIONS.forEach((badge) => {
    if (!earnedMap[badge.id] && badge.isEarned(updated)) {
      earnedMap[badge.id] = now;
      newlyEarned.push(badge);
    }
  });

  saveEarnedBadgesMap(earnedMap);

  // Store newly unlocked badges in session storage so results page can display fanfare
  if (newlyEarned.length > 0) {
    try {
      window.sessionStorage.setItem("typefly-recent-badges", JSON.stringify(newlyEarned));
    } catch {
      /* ignore */
    }
  }

  return newlyEarned;
}

export function loadEarnedBadgesMap(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(BADGES_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveEarnedBadgesMap(map: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(BADGES_STORAGE_KEY, JSON.stringify(map));
  } catch {
    /* ignore */
  }
}

/**
 * Get all badges enriched with current progress, earned status, and timestamp.
 */
export function getAllBadgesWithStatus(history: TestResult[]): {
  badges: BadgeWithStatus[];
  stats: LifetimeStats;
  earnedCount: number;
  totalCount: number;
} {
  const stats = calculateLifetimeStats(history);
  const earnedMap = loadEarnedBadgesMap();
  let mapUpdated = false;

  const badges: BadgeWithStatus[] = BADGE_DEFINITIONS.map((badge) => {
    const earnedByStats = badge.isEarned(stats);
    let unlockedAt = earnedMap[badge.id] ?? null;

    // Auto-reconcile in case user played earlier before badge tracking was initialized
    if (earnedByStats && !unlockedAt) {
      unlockedAt = new Date().toISOString();
      earnedMap[badge.id] = unlockedAt;
      mapUpdated = true;
    }

    return {
      ...badge,
      isEarned: earnedByStats || Boolean(unlockedAt),
      progress: badge.getProgress(stats),
      unlockedAt,
    };
  });

  if (mapUpdated) {
    saveEarnedBadgesMap(earnedMap);
  }

  const earnedCount = badges.filter((b) => b.isEarned).length;

  return {
    badges,
    stats,
    earnedCount,
    totalCount: badges.length,
  };
}

export function getTierColor(tier: BadgeTier) {
  switch (tier) {
    case "diamond":
      return {
        bg: "bg-cyan-500/15 dark:bg-cyan-500/20",
        border: "border-cyan-400 dark:border-cyan-400/80",
        text: "text-cyan-600 dark:text-cyan-300",
        badge: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900/50 dark:text-cyan-300",
        glow: "shadow-[0_0_15px_rgba(6,182,212,0.35)]",
      };
    case "gold":
      return {
        bg: "bg-amber-500/15 dark:bg-amber-500/20",
        border: "border-amber-400 dark:border-amber-400/80",
        text: "text-amber-600 dark:text-amber-300",
        badge: "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.35)]",
      };
    case "silver":
      return {
        bg: "bg-slate-500/15 dark:bg-slate-400/20",
        border: "border-slate-300 dark:border-slate-500",
        text: "text-slate-700 dark:text-slate-300",
        badge: "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300",
        glow: "shadow-[0_0_12px_rgba(148,163,184,0.25)]",
      };
    case "bronze":
    default:
      return {
        bg: "bg-orange-600/10 dark:bg-orange-600/20",
        border: "border-orange-300 dark:border-orange-500/60",
        text: "text-orange-700 dark:text-orange-300",
        badge: "bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300",
        glow: "shadow-[0_0_10px_rgba(234,88,12,0.2)]",
      };
  }
}

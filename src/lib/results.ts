import { supabase } from "@/integrations/supabase/client";

export type TestResult = {
  mode: "bird" | "beginner";
  durationSeconds: number;
  wpm: number;
  accuracy: number;
  errors: number;
  characters: number;
  words: number;
  bestCombo: number;
  livesLeft: number;
  finishedAt: string;
  score?: number;
  title?: string;
};

const LAST_RESULT_KEY = "typefly-last-result";
const HISTORY_KEY = "typefly-history";

export function saveResult(result: TestResult, userId?: string | null) {
  if (typeof window === "undefined") return;

  // Save for immediate results page display
  window.sessionStorage.setItem(LAST_RESULT_KEY, JSON.stringify(result));

  // Save to persistent local history
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    const history: TestResult[] = raw ? JSON.parse(raw) : [];
    history.unshift(result);
    // Keep last 50 games
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 50)));
  } catch (err) {
    console.warn("Failed to write game history to localStorage", err);
  }

  // Also sync to Supabase test_results if user is signed in
  if (userId) {
    void (async () => {
      try {
        await supabase.from("test_results").insert({
          user_id: userId,
          mode: result.mode,
          duration_seconds: result.durationSeconds,
          wpm: result.wpm,
          accuracy: result.accuracy,
          errors: result.errors,
          characters: result.characters,
          words: result.words,
          best_combo: result.bestCombo,
        });
      } catch (err) {
        console.warn("Could not sync test result to Supabase", err);
      }
    })();
  }
}

export function loadResult(): TestResult | null {
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem(LAST_RESULT_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as TestResult;
  } catch {
    return null;
  }
}

export function loadHistory(): TestResult[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as TestResult[]) : [];
  } catch {
    return [];
  }
}

export function getUserStats(history: TestResult[]) {
  if (history.length === 0) {
    return {
      totalFlights: 0,
      bestWpm: 0,
      averageWpm: 0,
      averageAccuracy: 100,
      bestCombo: 0,
      totalWords: 0,
    };
  }

  const bestWpm = Math.max(...history.map((h) => h.wpm));
  const bestCombo = Math.max(...history.map((h) => h.bestCombo || 0));
  const totalWords = history.reduce((sum, h) => sum + (h.words || 0), 0);
  const averageWpm = Math.round(history.reduce((sum, h) => sum + h.wpm, 0) / history.length);
  const averageAccuracy = Math.round(
    history.reduce((sum, h) => sum + h.accuracy, 0) / history.length,
  );

  return {
    totalFlights: history.length,
    bestWpm,
    averageWpm,
    averageAccuracy,
    bestCombo,
    totalWords,
  };
}

export function performanceSummary(wpm: number, accuracy: number) {
  if (accuracy < 85) return "Great effort! Slow down a little — accuracy first, speed follows.";
  if (wpm < 25) return "Nice start! Keep your fingers on the home row and build a steady rhythm.";
  if (wpm < 40) return "Solid flying! You are getting comfortable with the keys.";
  if (wpm < 60) return "Strong run! Your bird barely touched the ground.";
  if (wpm < 80) return "Excellent — that is confident, fluent typing.";
  return "Incredible! You type faster than your bird can flap.";
}

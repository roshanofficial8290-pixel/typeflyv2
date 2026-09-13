import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { SiteLayout } from "@/components/SiteLayout";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/hooks/useAuth";
import birdImg from "@/assets/bird.png";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in to TypeFly" },
      {
        name: "description",
        content: "Create a free TypeFly account to save your typing progress and unlock premium.",
      },
      { property: "og:title", content: "Sign in to TypeFly" },
      {
        property: "og:description",
        content: "Create a free account to save your typing progress.",
      },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [mode, setMode] = useState<"signin" | "signup" | "reset">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) void navigate({ to: "/profile" });
  }, [user, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setMessage(null);
    setIsSuccess(false);

    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { data: { display_name: name }, emailRedirectTo: window.location.origin },
        });
        if (error) {
          setMessage(error.message);
        } else {
          setIsSuccess(true);
          setMessage("Welcome aboard! Your TypeFly account is ready. Taking flight...");
          window.setTimeout(() => void navigate({ to: "/profile" }), 1200);
        }
      } else if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          setMessage(error.message);
        } else {
          setIsSuccess(true);
          setMessage("Signed in successfully! Redirecting...");
          window.setTimeout(() => void navigate({ to: "/profile" }), 800);
        }
      } else if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
        if (error) {
          setMessage(error.message);
        } else {
          setIsSuccess(true);
          setMessage("Password reset instructions have been sent to your email address.");
        }
      }
    } catch {
      setMessage("An unexpected issue occurred. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function handleGoogle() {
    setMessage(null);
    setIsSuccess(false);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
      });
      if (result.error) {
        // Fallback to supabase direct oauth if available
        const authHelper = supabase.auth as unknown as {
          signInWithOAuth?: (args: { provider: string }) => Promise<{
            data?: { user?: unknown };
            error?: { message?: string } | null;
          }>;
        };
        const sbResult = await authHelper.signInWithOAuth?.({ provider: "google" });
        if (sbResult?.error) {
          setMessage("Google sign-in failed. Please try with email/password.");
        }
      }
    } catch {
      // If simulated preview auth
      const authHelper = supabase.auth as unknown as {
        signInWithOAuth?: (args: { provider: string }) => Promise<{
          data?: { user?: unknown };
          error?: { message?: string } | null;
        }>;
      };
      const mockResult = await authHelper.signInWithOAuth?.({ provider: "google" });
      if (mockResult?.data?.user) {
        setIsSuccess(true);
        setMessage("Signed in with Google!");
        window.setTimeout(() => void navigate({ to: "/profile" }), 600);
      }
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-md px-4 py-12">
        <img
          src={birdImg}
          alt="TypeFly bird"
          width={96}
          height={96}
          loading="lazy"
          className="mx-auto h-20 w-20 animate-float"
        />
        <h1 className="mt-4 text-center font-display text-3xl font-extrabold">
          {mode === "signin"
            ? "Welcome back"
            : mode === "signup"
              ? "Join TypeFly"
              : "Reset Password"}
        </h1>
        <p className="mt-1 text-center text-sm text-muted-foreground">
          {mode === "signin"
            ? "Sign in to track your typing flights, WPM, and combos"
            : mode === "signup"
              ? "Create your free account to track your progress"
              : "Enter your email to receive password reset instructions"}
        </p>

        <form onSubmit={handleSubmit} className="panel mt-6 space-y-4 p-6">
          {mode === "signup" && (
            <label className="block text-sm font-bold">
              Display name
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="SkyPilot"
                className="mt-1 w-full rounded-xl border-2 border-input bg-muted px-3 py-2 outline-none focus:border-primary"
              />
            </label>
          )}

          <label className="block text-sm font-bold">
            Email
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="pilot@example.com"
              className="mt-1 w-full rounded-xl border-2 border-input bg-muted px-3 py-2 outline-none focus:border-primary"
            />
          </label>

          {mode !== "reset" && (
            <label className="block text-sm font-bold">
              <div className="flex items-center justify-between">
                <span>Password</span>
                {mode === "signin" && (
                  <button
                    type="button"
                    onClick={() => {
                      setMode("reset");
                      setMessage(null);
                    }}
                    className="text-xs font-normal text-muted-foreground underline hover:text-foreground"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
                className="mt-1 w-full rounded-xl border-2 border-input bg-muted px-3 py-2 outline-none focus:border-primary"
              />
            </label>
          )}

          <button type="submit" disabled={busy} className="btn-primary w-full">
            {busy
              ? "One moment…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset link"}
          </button>

          {mode !== "reset" && (
            <button
              type="button"
              onClick={handleGoogle}
              className="btn-ghost flex w-full items-center justify-center gap-2"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              Continue with Google
            </button>
          )}

          {message && (
            <p
              className={`rounded-xl p-3 text-center text-sm font-bold ${
                isSuccess
                  ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              {message}
            </p>
          )}

          <div className="space-y-2 text-center text-sm text-muted-foreground">
            {mode === "reset" ? (
              <button
                type="button"
                onClick={() => {
                  setMode("signin");
                  setMessage(null);
                }}
                className="font-bold text-foreground underline"
              >
                Back to sign in
              </button>
            ) : (
              <p>
                {mode === "signin" ? "New to TypeFly?" : "Already have an account?"}{" "}
                <button
                  type="button"
                  onClick={() => {
                    setMode(mode === "signin" ? "signup" : "signin");
                    setMessage(null);
                  }}
                  className="font-bold text-foreground underline"
                >
                  {mode === "signin" ? "Create an account" : "Sign in"}
                </button>
              </p>
            )}
          </div>
        </form>
      </div>
    </SiteLayout>
  );
}

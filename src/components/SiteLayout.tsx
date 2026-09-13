import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { MuteButton } from "./MuteButton";
import { useAuth } from "@/hooks/useAuth";
import birdImg from "@/assets/bird.png";

const navLinks = [
  { to: "/", label: "Lobby" },
  { to: "/beginner", label: "Beginner" },
  { to: "/play", label: "Typing Bird" },
  { to: "/pricing", label: "Premium" },
  { to: "/about", label: "About" },
] as const;

export function SiteLayout({ children }: { children: ReactNode }) {
  const { user, signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-30 border-b-2 border-border bg-card/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-3 px-4 py-3">
          <Link to="/" className="flex items-center gap-2">
            <img
              src={birdImg}
              alt="TypeFly bird mascot"
              width={40}
              height={40}
              className="h-10 w-10"
            />
            <span className="font-display text-2xl font-extrabold">TypeFly</span>
          </Link>
          <nav className="flex flex-1 flex-wrap items-center gap-1 text-sm font-bold">
            {navLinks.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-full px-3 py-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{ className: "rounded-full px-3 py-1.5 bg-muted text-foreground" }}
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <MuteButton />
          {user ? (
            <div className="flex items-center gap-2">
              <Link to="/profile" className="btn-ghost text-sm">
                Profile
              </Link>
              <button onClick={signOut} className="btn-ghost text-sm">
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/auth" className="btn-primary text-sm">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t-2 border-border bg-card">
        <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-8 sm:grid-cols-3">
          <div>
            <p className="font-display text-xl font-extrabold">TypeFly</p>
            <p className="mt-1 text-sm text-muted-foreground">
              A cozy little place to learn typing while your bird flies.
            </p>
          </div>
          <div className="text-sm">
            <p className="font-display font-bold">Play</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                <Link to="/play" className="hover:text-foreground">
                  Typing Bird
                </Link>
              </li>
              <li>
                <Link to="/beginner" className="hover:text-foreground">
                  Beginner Mode
                </Link>
              </li>
              <li>
                <Link to="/pricing" className="hover:text-foreground">
                  Premium
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-foreground">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          <div className="text-sm">
            <p className="font-display font-bold">Legal</p>
            <ul className="mt-2 space-y-1 text-muted-foreground">
              <li>
                <Link to="/privacy" className="hover:text-foreground">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-foreground">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link to="/cookies" className="hover:text-foreground">
                  Cookie Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>
        <p className="pb-6 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} TypeFly. Made with feathers and keystrokes.
        </p>
      </footer>
    </div>
  );
}

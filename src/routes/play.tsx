import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/SiteLayout";
import { MuteButton } from "@/components/MuteButton";
import { initSfx, sfx } from "@/lib/sfx";
import { saveResult } from "@/lib/results";
import { useAuth } from "@/hooks/useAuth";
import { FALLBACK_PASSAGES, getRandomPassage, type TypingPassage } from "@/lib/typingContent";
import { generateTypingPassage } from "@/lib/gemini.functions";
import birdImg from "@/assets/bird.png";

export const Route = createFileRoute("/play")({
  head: () => ({
    meta: [
      { title: "Typing Bird Flight — TypeFly" },
      {
        name: "description",
        content:
          "Flap through the skies by typing natural quotes, stories, and facts. Avoid pipe obstacles, keep your hearts, and soar!",
      },
      { property: "og:title", content: "Typing Bird Flight — TypeFly" },
      {
        property: "og:description",
        content:
          "Continuous Flappy Bird-style typing flight with pipe obstacles, combo streaks, and natural typing passages.",
      },
    ],
  }),
  component: PlayPage,
});

const CATEGORIES = [
  { id: "all", label: "All Topics", emoji: "✨" },
  { id: "nature", label: "Nature & Birds", emoji: "🌿" },
  { id: "facts", label: "Curious Facts", emoji: "💡" },
  { id: "technology", label: "Tech & Code", emoji: "💻" },
  { id: "quotes", label: "Wisdom Quotes", emoji: "📜" },
  { id: "pangrams", label: "Pangrams", emoji: "⚡" },
  { id: "stories", label: "Short Stories", emoji: "📖" },
] as const;

const DURATIONS = [
  { label: "1 min", value: 60 },
  { label: "2 min", value: 120 },
  { label: "5 min", value: 300 },
];

type Pipe = {
  x: number;
  topHeight: number;
  bottomY: number;
  width: number;
  passed: boolean;
};

type Particle = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
};

function PlayPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const generateAiPassage = useServerFn(generateTypingPassage);

  // Initial passage is strictly deterministic (FALLBACK_PASSAGES[0]) to prevent SSR hydration mismatch
  const [passage, setPassage] = useState<TypingPassage>(FALLBACK_PASSAGES[0]!);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [duration, setDuration] = useState(60);
  const [phase, setPhase] = useState<"setup" | "playing" | "gameover">("setup");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Typing state
  const [charIndex, setCharIndex] = useState(0);
  const [typed, setTyped] = useState("");
  const [timeLeft, setTimeLeft] = useState(60);
  const [lives, setLives] = useState(3);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [correctChars, setCorrectChars] = useState(0);
  const [totalKeys, setTotalKeys] = useState(0);
  const [errors, setErrors] = useState(0);
  const [passagesCompleted, setPassagesCompleted] = useState(0);
  const [pipesCleared, setPipesCleared] = useState(0);

  // Visual feedback states
  const [shake, setShake] = useState(false);
  const [comboBanner, setComboBanner] = useState<string | null>(null);

  // Refs for game loop & canvas
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const birdImgRef = useRef<HTMLImageElement | null>(null);

  // Physics simulation state refs (so requestAnimationFrame accesses freshest values)
  const gameStateRef = useRef({
    birdY: 150,
    birdVy: 0,
    birdAngle: 0,
    pipes: [] as Pipe[],
    particles: [] as Particle[],
    bgScroll: 0,
    groundScroll: 0,
    invulnerableFrames: 0,
    isAlive: true,
    lastFrameTime: 0,
    speed: 2.2,
  });

  // Calculate live stats
  const elapsed = duration - timeLeft;
  const wpm = elapsed > 2 ? Math.round(correctChars / 5 / (elapsed / 60)) : 0;
  const accuracy = totalKeys > 0 ? Math.round((correctChars / totalKeys) * 100) : 100;

  // Initialize sound on mount & load bird image
  useEffect(() => {
    initSfx();
    const img = new Image();
    img.src = birdImg;
    img.onload = () => {
      birdImgRef.current = img;
    };
  }, []);

  // Finish flight & save stats
  const finishGame = useCallback(
    (finalLives: number) => {
      const usedSeconds = Math.max(1, duration - timeLeft);
      const computedWpm = Math.round(correctChars / 5 / (usedSeconds / 60)) || 0;
      const computedAccuracy = totalKeys > 0 ? Math.round((correctChars / totalKeys) * 100) : 100;

      saveResult(
        {
          mode: "bird",
          durationSeconds: duration,
          wpm: computedWpm,
          accuracy: computedAccuracy,
          errors,
          characters: correctChars,
          words:
            passage.text.slice(0, charIndex).trim().split(/\s+/).length + passagesCompleted * 35,
          bestCombo,
          livesLeft: Math.max(0, finalLives),
          finishedAt: new Date().toISOString(),
        },
        user?.id,
      );

      if (finalLives <= 0) {
        sfx.heart();
        setPhase("gameover");
      } else {
        sfx.finish();
        void navigate({ to: "/results" });
      }
    },
    [
      bestCombo,
      correctChars,
      duration,
      errors,
      navigate,
      passagesCompleted,
      timeLeft,
      totalKeys,
      user?.id,
      passage.text,
      charIndex,
    ],
  );

  // Countdown timer
  useEffect(() => {
    if (phase !== "playing") return;
    const timer = window.setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          finishGame(lives);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(timer);
  }, [phase, finishGame, lives]);

  // Spawn pipe obstacles periodically
  const spawnPipe = useCallback((canvasWidth: number, canvasHeight: number) => {
    const gapHeight = 155; // Height opening between top and bottom pipe
    const minTop = 60;
    const maxTop = canvasHeight - gapHeight - 80;
    const topHeight = Math.floor(minTop + Math.random() * (maxTop - minTop));
    const pipe: Pipe = {
      x: canvasWidth + 20,
      topHeight,
      bottomY: topHeight + gapHeight,
      width: 58,
      passed: false,
    };
    gameStateRef.current.pipes.push(pipe);
  }, []);

  // Main 60 FPS Canvas Game Loop
  useEffect(() => {
    if (phase !== "playing") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Reset initial game loop variables
    gameStateRef.current.birdY = height * 0.45;
    gameStateRef.current.birdVy = 0;
    gameStateRef.current.pipes = [];
    gameStateRef.current.particles = [];
    gameStateRef.current.invulnerableFrames = 0;
    gameStateRef.current.speed = 2.4;

    // Pre-populate initial upcoming pipe
    spawnPipe(width + 120, height);

    const loop = () => {
      const g = gameStateRef.current;

      // 1. Gravity & Physics
      g.birdVy += 0.24;
      g.birdVy = Math.min(g.birdVy, 8);
      g.birdY += g.birdVy;
      g.birdAngle = Math.max(-28, Math.min(65, g.birdVy * 4.8));

      if (g.invulnerableFrames > 0) {
        g.invulnerableFrames--;
      }

      // Parallax scroll
      g.bgScroll = (g.bgScroll + g.speed * 0.4) % width;
      g.groundScroll = (g.groundScroll + g.speed) % 24;

      // Check ceiling / ground collisions
      const birdRadius = 18;
      const groundY = height - 34;

      if (g.birdY <= birdRadius) {
        g.birdY = birdRadius;
        g.birdVy = 0.5;
      }

      let hitGround = false;
      if (g.birdY >= groundY - birdRadius) {
        g.birdY = groundY - birdRadius;
        hitGround = true;
      }

      // 2. Clear Canvas & Draw Sky
      ctx.clearRect(0, 0, width, height);

      // Sky Gradient
      const skyGrad = ctx.createLinearGradient(0, 0, 0, height);
      skyGrad.addColorStop(0, "#38bdf8");
      skyGrad.addColorStop(0.65, "#bae6fd");
      skyGrad.addColorStop(1, "#f0f9ff");
      ctx.fillStyle = skyGrad;
      ctx.fillRect(0, 0, width, height);

      // Distant clouds
      ctx.fillStyle = "rgba(255, 255, 255, 0.55)";
      for (let i = 0; i < 4; i++) {
        const cx = ((i * 240 - g.bgScroll) % (width + 120)) - 60;
        const cy = 40 + (i % 2) * 35;
        ctx.beginPath();
        ctx.arc(cx, cy, 32, 0, Math.PI * 2);
        ctx.arc(cx + 25, cy - 10, 24, 0, Math.PI * 2);
        ctx.arc(cx + 50, cy, 30, 0, Math.PI * 2);
        ctx.fill();
      }

      // 3. Pipe Obstacles Logic & Drawing
      const birdX = 95;
      let collisionDetected = hitGround;

      // Spawn pipes if needed
      const lastPipe = g.pipes[g.pipes.length - 1];
      if (!lastPipe || lastPipe.x < width - 280) {
        spawnPipe(width, height);
      }

      // Update and draw pipes
      for (let i = g.pipes.length - 1; i >= 0; i--) {
        const pipe = g.pipes[i]!;
        pipe.x -= g.speed;

        // Draw Top Pipe
        ctx.save();
        ctx.fillStyle = "#22c55e";
        ctx.strokeStyle = "#15803d";
        ctx.lineWidth = 3;

        // Top pipe body
        ctx.fillRect(pipe.x, 0, pipe.width, pipe.topHeight);
        ctx.strokeRect(pipe.x, -2, pipe.width, pipe.topHeight + 2);
        // Top pipe lip
        ctx.fillRect(pipe.x - 4, pipe.topHeight - 20, pipe.width + 8, 20);
        ctx.strokeRect(pipe.x - 4, pipe.topHeight - 20, pipe.width + 8, 20);
        // Highlights on top pipe
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillRect(pipe.x + 4, 0, 6, pipe.topHeight);

        // Draw Bottom Pipe
        ctx.fillStyle = "#22c55e";
        const bottomHeight = groundY - pipe.bottomY;
        ctx.fillRect(pipe.x, pipe.bottomY, pipe.width, bottomHeight);
        ctx.strokeRect(pipe.x, pipe.bottomY, pipe.width, bottomHeight + 4);
        // Bottom pipe lip
        ctx.fillRect(pipe.x - 4, pipe.bottomY, pipe.width + 8, 20);
        ctx.strokeRect(pipe.x - 4, pipe.bottomY, pipe.width + 8, 20);
        // Highlights on bottom pipe
        ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
        ctx.fillRect(pipe.x + 4, pipe.bottomY, 6, bottomHeight);
        ctx.restore();

        // Check if bird passed pipe
        if (!pipe.passed && pipe.x + pipe.width < birdX) {
          pipe.passed = true;
          setPipesCleared((c) => c + 1);
          // Spawn little clearance sparkle particles
          for (let p = 0; p < 6; p++) {
            g.particles.push({
              x: birdX + 20,
              y: g.birdY,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: "#fde047",
              size: Math.random() * 3.5 + 1.5,
              life: 0,
              maxLife: 25,
            });
          }
        }

        // Collision Check (AABB with circle margin)
        if (birdX + birdRadius > pipe.x && birdX - birdRadius < pipe.x + pipe.width) {
          if (g.birdY - birdRadius < pipe.topHeight || g.birdY + birdRadius > pipe.bottomY) {
            collisionDetected = true;
          }
        }

        // Cleanup offscreen pipes
        if (pipe.x + pipe.width < -30) {
          g.pipes.splice(i, 1);
        }
      }

      // Handle Collision
      if (collisionDetected && g.invulnerableFrames === 0) {
        g.invulnerableFrames = 70; // ~1.1s invulnerability
        g.birdVy = -3.8; // Bounce
        sfx.wrong();
        setShake(true);
        window.setTimeout(() => setShake(false), 320);

        // Spawn golden and red feather collision particles
        for (let p = 0; p < 18; p++) {
          g.particles.push({
            x: birdX,
            y: g.birdY,
            vx: (Math.random() - 0.5) * 7,
            vy: (Math.random() - 0.7) * 7,
            color: p % 2 === 0 ? "#ef4444" : "#fef08a",
            size: Math.random() * 5 + 2,
            life: 0,
            maxLife: 35,
          });
        }

        setCombo(0);
        setLives((currentLives) => {
          const next = currentLives - 1;
          if (next <= 0) {
            finishGame(0);
          }
          return Math.max(0, next);
        });
      }

      // 4. Draw Rolling Ground
      ctx.fillStyle = "#86efac";
      ctx.fillRect(0, groundY, width, height - groundY);
      ctx.fillStyle = "#15803d";
      ctx.fillRect(0, groundY, width, 4);

      // Rolling ground stripes
      ctx.fillStyle = "#4ade80";
      for (let gx = -g.groundScroll; gx < width; gx += 24) {
        ctx.beginPath();
        ctx.moveTo(gx, groundY + 4);
        ctx.lineTo(gx + 12, groundY + 4);
        ctx.lineTo(gx + 6, height);
        ctx.lineTo(gx - 6, height);
        ctx.fill();
      }

      // 5. Update & Draw Particles
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i]!;
        pt.x += pt.vx;
        pt.y += pt.vy;
        pt.vy += 0.12; // particle gravity
        pt.life++;
        const alpha = 1 - pt.life / pt.maxLife;

        ctx.save();
        ctx.globalAlpha = Math.max(0, alpha);
        ctx.fillStyle = pt.color;
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        if (pt.life >= pt.maxLife) {
          g.particles.splice(i, 1);
        }
      }

      // 6. Draw Bird
      ctx.save();
      ctx.translate(birdX, g.birdY);
      ctx.rotate((g.birdAngle * Math.PI) / 180);

      // Invulnerability blink effect
      if (g.invulnerableFrames > 0 && Math.floor(g.invulnerableFrames / 6) % 2 === 0) {
        ctx.globalAlpha = 0.35;
      }

      if (birdImgRef.current && birdImgRef.current.complete) {
        ctx.drawImage(birdImgRef.current, -26, -26, 52, 52);
      } else {
        // Fallback procedural aviator bird
        ctx.fillStyle = "#f59e0b";
        ctx.beginPath();
        ctx.arc(0, 0, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ea580c";
        ctx.beginPath();
        ctx.moveTo(12, -4);
        ctx.lineTo(24, 2);
        ctx.lineTo(12, 8);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(6, -6, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#000000";
        ctx.beginPath();
        ctx.arc(8, -6, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [phase, spawnPipe, finishGame]);

  // Trigger bird flap upwards
  const flapBird = useCallback(() => {
    gameStateRef.current.birdVy = -5.5; // Upward flap impulse

    // Spawn tiny white cloud/wind puff particle behind bird
    gameStateRef.current.particles.push({
      x: 75,
      y: gameStateRef.current.birdY + 10,
      vx: -1.5,
      vy: 1.2,
      color: "rgba(255, 255, 255, 0.8)",
      size: 4,
      life: 0,
      maxLife: 15,
    });
  }, []);

  // Handle typing input
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (phase !== "playing") return;
    const key = e.key;

    // Disregard non-character meta keys (Shift, Alt, Ctrl, etc.)
    if (key.length !== 1 && key !== "Backspace") return;
    e.preventDefault();

    const expected = passage.text[charIndex];

    if (key === "Backspace") {
      if (charIndex > 0) {
        setCharIndex((c) => c - 1);
        setTyped((t) => t.slice(0, -1));
      }
      return;
    }

    setTotalKeys((t) => t + 1);

    if (key === expected) {
      // CORRECT KEY!
      sfx.key();
      flapBird();
      setCorrectChars((c) => c + 1);
      const nextCharIndex = charIndex + 1;
      setCharIndex(nextCharIndex);
      setTyped((t) => t + key);

      // Update combo & streak
      setCombo((prevCombo) => {
        const nextCombo = prevCombo + 1;
        setBestCombo((b) => Math.max(b, nextCombo));

        if (nextCombo === 10 || nextCombo === 25 || nextCombo === 50) {
          sfx.combo();
          setComboBanner(`🔥 ${nextCombo}x Streak!`);
          window.setTimeout(() => setComboBanner(null), 1400);

          // Star particles
          for (let p = 0; p < 12; p++) {
            gameStateRef.current.particles.push({
              x: 100,
              y: gameStateRef.current.birdY,
              vx: (Math.random() - 0.5) * 6,
              vy: (Math.random() - 0.5) * 6,
              color: "#38bdf8",
              size: 4,
              life: 0,
              maxLife: 30,
            });
          }
        }
        return nextCombo;
      });

      // If user finished current passage
      if (nextCharIndex >= passage.text.length) {
        sfx.word();
        setPassagesCompleted((p) => p + 1);
        // Load next passage in current category
        const next = getRandomPassage(selectedCategory);
        setPassage(next);
        setCharIndex(0);
        setTyped("");
      }
    } else {
      // WRONG KEY!
      sfx.wrong();
      setErrors((err) => err + 1);
      setCombo(0);
      gameStateRef.current.birdVy += 2.6; // Dip penalty
      setShake(true);
      window.setTimeout(() => setShake(false), 240);
    }
  }

  // Start new flight
  function startFlight() {
    setCharIndex(0);
    setTyped("");
    setTimeLeft(duration);
    setLives(3);
    setCombo(0);
    setBestCombo(0);
    setCorrectChars(0);
    setTotalKeys(0);
    setErrors(0);
    setPassagesCompleted(0);
    setPipesCleared(0);
    setPhase("playing");
    sfx.start();
    window.setTimeout(() => inputRef.current?.focus(), 60);
  }

  // Switch category
  function handleSelectCategory(catId: string) {
    setSelectedCategory(catId);
    const newPassage = getRandomPassage(catId);
    setPassage(newPassage);
    setCharIndex(0);
    setTyped("");
  }

  // Generate with AI
  async function handleGenerateAi() {
    setIsAiLoading(true);
    try {
      const result = await generateAiPassage({
        data: {
          topic: selectedCategory === "all" ? undefined : selectedCategory,
          difficulty: "medium",
        },
      });
      if (result.passage) {
        setPassage(result.passage);
        setCharIndex(0);
        setTyped("");
      }
    } catch {
      // Graceful fallback
      setPassage(getRandomPassage(selectedCategory));
    } finally {
      setIsAiLoading(false);
    }
  }

  return (
    <SiteLayout>
      <div className="mx-auto w-full max-w-5xl px-4 py-6 sm:py-8">
        {/* Title Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-extrabold sm:text-4xl">Typing Bird Flight</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Flap through the skies by typing each letter. Avoid obstacles and keep your hearts!
            </p>
          </div>
          <div className="flex items-center gap-3">
            <MuteButton />
            <Link to="/beginner" className="btn-ghost text-xs">
              Beginner Finger Guide →
            </Link>
          </div>
        </div>

        {/* Live HUD Stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-6">
          <Stat
            label="Time"
            value={`${Math.floor(timeLeft / 60)}:${String(timeLeft % 60).padStart(2, "0")}`}
            sub="Remaining"
          />
          <Stat label="Speed" value={`${wpm} WPM`} sub="Live speed" />
          <Stat label="Accuracy" value={`${accuracy}%`} sub={`${errors} mistakes`} />
          <Stat label="Streak" value={`x${combo}`} sub={`Best: x${bestCombo}`} />
          <Stat label="Pipes" value={String(pipesCleared)} sub="Cleared" />
          <Stat
            label="Lives"
            value={"❤️".repeat(Math.max(0, lives)) || "Out!"}
            sub={`${lives}/3 hearts`}
          />
        </div>

        {/* Game Canvas Arena */}
        <div
          className={`relative mt-4 overflow-hidden rounded-3xl border-2 border-border shadow-md transition-transform ${
            shake ? "animate-shake border-destructive ring-2 ring-destructive/40" : ""
          }`}
        >
          <canvas
            ref={canvasRef}
            width={860}
            height={340}
            className="h-64 w-full bg-sky-200 sm:h-80"
          />

          {/* Floating Streak Banner */}
          {comboBanner && (
            <div className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 animate-pop rounded-full bg-accent px-5 py-1.5 font-display text-base font-extrabold text-accent-foreground shadow-lg">
              {comboBanner}
            </div>
          )}

          {/* Setup Overlay */}
          {phase === "setup" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 p-6 text-center backdrop-blur-sm">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 shadow-inner">
                <img src={birdImg} alt="TypeFly Bird" className="h-12 w-12 object-contain" />
              </div>
              <h2 className="mt-3 font-display text-2xl font-extrabold sm:text-3xl">
                Ready for Takeoff?
              </h2>
              <p className="mt-1 max-w-md text-xs text-muted-foreground sm:text-sm">
                Each correct letter flaps the wings upward. Watch out for pipes and keep your bird
                soaring through the clouds.
              </p>

              {/* Flight Duration Selector */}
              <div className="mt-4 flex items-center gap-2">
                <span className="text-xs font-bold text-muted-foreground">Flight Duration:</span>
                {DURATIONS.map((d) => (
                  <button
                    key={d.value}
                    onClick={() => {
                      setDuration(d.value);
                      setTimeLeft(d.value);
                    }}
                    className={
                      duration === d.value
                        ? "btn-primary text-xs py-1 px-3"
                        : "btn-ghost text-xs py-1 px-3"
                    }
                  >
                    {d.label}
                  </button>
                ))}
              </div>

              <button
                onClick={startFlight}
                className="btn-primary mt-5 text-sm px-8 py-3 font-bold shadow-md"
              >
                Take Off! 🚀
              </button>
            </div>
          )}

          {/* Game Over Overlay */}
          {phase === "gameover" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/90 p-6 text-center backdrop-blur-md animate-in fade-in">
              <div className="text-4xl">💥</div>
              <h2 className="mt-2 font-display text-2xl font-extrabold text-destructive sm:text-3xl">
                Flight Concluded
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                You soared at <strong className="text-foreground">{wpm} WPM</strong> and cleared{" "}
                <strong className="text-foreground">{pipesCleared} pipes</strong> before running out
                of hearts.
              </p>
              <div className="mt-5 flex flex-wrap justify-center gap-3">
                <button onClick={startFlight} className="btn-primary text-xs">
                  Fly Again 🔄
                </button>
                <Link to="/results" className="btn-accent text-xs">
                  See Full Career Stats →
                </Link>
                <Link to="/beginner" className="btn-ghost text-xs">
                  Practice in Beginner Mode
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Typing Content Box & Category Switcher */}
        <div className="panel mt-4 p-6">
          {/* Category Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCategory(cat.id)}
                  className={`rounded-xl px-3 py-1 text-xs font-bold transition-all ${
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "bg-muted text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className="mr-1">{cat.emoji}</span>
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  const next = getRandomPassage(selectedCategory);
                  setPassage(next);
                  setCharIndex(0);
                  setTyped("");
                }}
                className="btn-ghost text-xs py-1 px-2.5"
                title="Load another passage from this category"
              >
                Next Text ↻
              </button>
              <button
                type="button"
                onClick={handleGenerateAi}
                disabled={isAiLoading}
                className="btn-ghost border border-primary/30 text-xs py-1 px-2.5 text-primary"
                title="Generate custom passage with AI"
              >
                {isAiLoading ? "Generating…" : "AI Passage ✨"}
              </button>
            </div>
          </div>

          {/* Passage Title */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-xs font-extrabold uppercase tracking-wider text-muted-foreground">
              {passage.title}
            </p>
            <span className="font-mono text-xs text-muted-foreground">
              {charIndex} / {passage.text.length} chars
            </span>
          </div>

          {/* Interactive Passage Rendering */}
          <div className="relative mt-3 rounded-2xl bg-muted/40 p-4 font-mono text-lg leading-relaxed sm:text-xl border border-border">
            {passage.text.split("").map((ch, idx) => {
              const isTyped = idx < charIndex;
              const isCurrent = idx === charIndex;

              return (
                <span
                  key={idx}
                  className={
                    isTyped
                      ? "font-bold text-foreground"
                      : isCurrent
                        ? "rounded bg-primary/20 text-primary border-b-2 border-primary font-bold animate-pulse"
                        : "text-muted-foreground/60"
                  }
                >
                  {ch}
                </span>
              );
            })}
          </div>

          {/* Hidden/Active Keyboard Capture Input */}
          <input
            ref={inputRef}
            value=""
            onChange={() => undefined}
            onKeyDown={handleKeyDown}
            aria-label="Active flight typing area"
            autoComplete="off"
            autoCapitalize="off"
            spellCheck={false}
            className="mt-4 w-full rounded-2xl border-2 border-input bg-muted px-4 py-3 text-center font-mono text-sm outline-none focus:border-primary"
            placeholder={
              phase === "playing"
                ? "Start typing the passage above to flap..."
                : "Press 'Take Off!' to begin flying"
            }
            disabled={phase !== "playing"}
          />

          {phase === "playing" && (
            <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>Tip: Typing the correct letter flaps the wings!</span>
              <button
                type="button"
                onClick={() => finishGame(lives)}
                className="hover:text-foreground underline"
              >
                End flight early
              </button>
            </div>
          )}
        </div>
      </div>
    </SiteLayout>
  );
}

function Stat({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="panel px-3 py-2 text-center">
      <p className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-0.5 font-display text-lg font-extrabold text-foreground sm:text-xl">
        {value}
      </p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

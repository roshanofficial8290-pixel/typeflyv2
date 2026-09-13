import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { SiteLayout } from "@/components/SiteLayout";
import { MuteButton } from "@/components/MuteButton";
import { SoundEffectsManager, initSfx, sfx } from "@/lib/sfx";
import { saveResult } from "@/lib/results";
import { useAuth } from "@/hooks/useAuth";
import { FALLBACK_PASSAGES, getRandomPassage, type TypingPassage } from "@/lib/typingContent";
import { generateTypingPassage } from "@/lib/gemini.functions";
import { KeyboardShortcutsBar } from "@/components/KeyboardShortcutsBar";
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

type ParticleType = "feather" | "spark" | "shockwave" | "smoke" | "star";

type Particle = {
  type: ParticleType;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
  angle?: number;
  vAngle?: number;
  drag?: number;
  gravity?: number;
  oscSpeed?: number;
  oscAmp?: number;
  radius?: number;
  maxRadius?: number;
  lineWidth?: number;
};

function spawnCollisionParticles(particles: Particle[], x: number, y: number, isFatal: boolean) {
  // 1. Shockwave rings radiating outwards
  particles.push({
    type: "shockwave",
    x,
    y,
    vx: 0,
    vy: 0,
    color: isFatal ? "#f59e0b" : "#ef4444",
    size: 0,
    radius: 8,
    maxRadius: isFatal ? 160 : 75,
    lineWidth: isFatal ? 6 : 4,
    life: 0,
    maxLife: isFatal ? 48 : 28,
  });

  if (isFatal) {
    particles.push({
      type: "shockwave",
      x,
      y,
      vx: 0,
      vy: 0,
      color: "rgba(255, 255, 255, 0.9)",
      size: 0,
      radius: 4,
      maxRadius: 190,
      lineWidth: 5,
      life: 0,
      maxLife: 52,
    });
  }

  // 2. Fluttering feathers with aerodynamic rotation and air sway
  const featherCount = isFatal ? 38 : 16;
  const featherColors = ["#f59e0b", "#fbbf24", "#ea580c", "#ef4444", "#fef08a", "#ffffff"];
  for (let i = 0; i < featherCount; i++) {
    const angle = (Math.PI * 2 * i) / featherCount + (Math.random() - 0.5) * 0.5;
    const speed = isFatal ? 3.5 + Math.random() * 6.5 : 2 + Math.random() * 4.5;
    particles.push({
      type: "feather",
      x: x + (Math.random() - 0.5) * 12,
      y: y + (Math.random() - 0.5) * 12,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (isFatal ? 3.2 : 1.5),
      color: featherColors[Math.floor(Math.random() * featherColors.length)]!,
      size: 4 + Math.random() * 4.5,
      life: 0,
      maxLife: isFatal ? 80 + Math.floor(Math.random() * 45) : 45 + Math.floor(Math.random() * 25),
      angle: Math.random() * Math.PI * 2,
      vAngle: (Math.random() - 0.5) * 0.22,
      drag: 0.965,
      gravity: 0.08 + Math.random() * 0.06,
      oscSpeed: 0.08 + Math.random() * 0.08,
      oscAmp: 1.2 + Math.random() * 1.5,
    });
  }

  // 3. High-velocity impact spark streaks
  const sparkCount = isFatal ? 32 : 18;
  const sparkColors = ["#ffffff", "#fef08a", "#fde047", "#fdba74"];
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = isFatal ? 5.5 + Math.random() * 8 : 4 + Math.random() * 6;
    particles.push({
      type: "spark",
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      color: sparkColors[Math.floor(Math.random() * sparkColors.length)]!,
      size: 1.5 + Math.random() * 2,
      life: 0,
      maxLife: isFatal ? 32 : 22,
      drag: 0.94,
    });
  }

  // 4. Soft smoke / cloud puffs
  const smokeCount = isFatal ? 16 : 8;
  for (let i = 0; i < smokeCount; i++) {
    particles.push({
      type: "smoke",
      x: x + (Math.random() - 0.5) * 16,
      y: y + (Math.random() - 0.5) * 16,
      vx: (Math.random() - 0.5) * 3,
      vy: (Math.random() - 0.5) * 3 - 0.5,
      color: isFatal ? "rgba(254, 243, 199, 0.45)" : "rgba(254, 202, 202, 0.4)",
      size: 8 + Math.random() * 8,
      life: 0,
      maxLife: isFatal ? 55 : 35,
      drag: 0.92,
    });
  }

  // 5. If fatal death explosion, add starlight spirit fragments
  if (isFatal) {
    for (let i = 0; i < 22; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5.5;
      particles.push({
        type: "star",
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: i % 2 === 0 ? "#38bdf8" : "#fef08a",
        size: 3.5 + Math.random() * 3,
        life: 0,
        maxLife: 60,
        vAngle: (Math.random() - 0.5) * 0.3,
        angle: Math.random() * Math.PI,
        drag: 0.96,
        gravity: 0.04,
      });
    }
  }
}

function PlayPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const generateAiPassage = useServerFn(generateTypingPassage);

  // Initial passage is strictly deterministic (FALLBACK_PASSAGES[0]) to prevent SSR hydration mismatch
  const [passage, setPassage] = useState<TypingPassage>(FALLBACK_PASSAGES[0]!);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [duration, setDuration] = useState(60);
  const [phase, setPhase] = useState<"setup" | "playing" | "gameover">("setup");
  const [isPaused, setIsPaused] = useState(false);
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
    isDead: false,
    deathFrames: 0,
    screenFlashAlpha: 0,
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
    if (phase !== "playing" || isPaused) return;
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
  }, [phase, isPaused, finishGame, lives]);

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
    if (phase === "setup") return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const width = canvas.width;
    const height = canvas.height;

    // Reset initial game loop variables if starting fresh
    if (gameStateRef.current.pipes.length === 0) {
      gameStateRef.current.birdY = height * 0.45;
      gameStateRef.current.birdVy = 0;
      gameStateRef.current.birdAngle = 0;
      gameStateRef.current.pipes = [];
      gameStateRef.current.particles = [];
      gameStateRef.current.invulnerableFrames = 0;
      gameStateRef.current.isDead = false;
      gameStateRef.current.deathFrames = 0;
      gameStateRef.current.screenFlashAlpha = 0;
      gameStateRef.current.speed = 2.4;
      spawnPipe(width + 120, height);
    }

    const loop = () => {
      const g = gameStateRef.current;

      // 1. Gravity & Physics
      if (!g.isDead) {
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
      } else {
        // Increment death animation frame counter
        g.deathFrames++;
        if (g.deathFrames === 55) {
          finishGame(0);
        }
      }

      // Check ceiling / ground collisions
      const birdRadius = 18;
      const groundY = height - 34;

      if (!g.isDead && g.birdY <= birdRadius) {
        g.birdY = birdRadius;
        g.birdVy = 0.5;
      }

      let hitGround = false;
      if (!g.isDead && g.birdY >= groundY - birdRadius) {
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

      // Spawn pipes if needed (only while playing and bird alive)
      if (phase === "playing" && !g.isDead) {
        const lastPipe = g.pipes[g.pipes.length - 1];
        if (!lastPipe || lastPipe.x < width - 280) {
          spawnPipe(width, height);
        }
      }

      // Update and draw pipes
      for (let i = g.pipes.length - 1; i >= 0; i--) {
        const pipe = g.pipes[i]!;
        if (!g.isDead) {
          pipe.x -= g.speed;
        }

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
        if (!pipe.passed && !g.isDead && pipe.x + pipe.width < birdX) {
          pipe.passed = true;
          setPipesCleared((c) => c + 1);
          // Spawn pipe clearance sparkle particles
          for (let p = 0; p < 6; p++) {
            g.particles.push({
              type: "spark",
              x: birdX + 20,
              y: g.birdY,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
              color: "#fde047",
              size: Math.random() * 2.5 + 1.5,
              life: 0,
              maxLife: 25,
            });
          }
        }

        // Collision Check (AABB with circle margin)
        if (!g.isDead && birdX + birdRadius > pipe.x && birdX - birdRadius < pipe.x + pipe.width) {
          if (g.birdY - birdRadius < pipe.topHeight || g.birdY + birdRadius > pipe.bottomY) {
            collisionDetected = true;
          }
        }

        // Cleanup offscreen pipes
        if (pipe.x + pipe.width < -30) {
          g.pipes.splice(i, 1);
        }
      }

      // Handle Collision / Death Trigger
      if (collisionDetected && g.invulnerableFrames === 0 && !g.isDead && phase === "playing") {
        setCombo(0);
        setLives((currentLives) => {
          const next = currentLives - 1;
          const isFatal = next <= 0;

          if (isFatal) {
            // FATAL BIRD DEATH
            g.isDead = true;
            g.deathFrames = 0;
            g.screenFlashAlpha = 0.75;
            sfx.gameover();
            spawnCollisionParticles(g.particles, birdX, g.birdY, true);
          } else {
            // NON-FATAL COLLISION IMPACT
            g.invulnerableFrames = 70; // ~1.1s invulnerability
            g.birdVy = -3.8; // Bounce
            g.screenFlashAlpha = 0.35;
            sfx.wrong();
            spawnCollisionParticles(g.particles, birdX, g.birdY, false);
          }

          setShake(true);
          window.setTimeout(() => setShake(false), isFatal ? 450 : 280);

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

      // 5. Update & Draw Particles (Canvas-based visual feedback system)
      for (let i = g.particles.length - 1; i >= 0; i--) {
        const pt = g.particles[i]!;
        pt.life++;
        const alpha = Math.max(0, 1 - pt.life / pt.maxLife);

        if (pt.type === "shockwave") {
          // Expanding shockwave ring
          const progress = pt.life / pt.maxLife;
          const currentRadius =
            (pt.radius || 6) +
            ((pt.maxRadius || 80) - (pt.radius || 6)) * Math.sin((progress * Math.PI) / 2);
          ctx.save();
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, currentRadius, 0, Math.PI * 2);
          ctx.strokeStyle = pt.color;
          ctx.globalAlpha = alpha * 0.85;
          ctx.lineWidth = Math.max(1, (pt.lineWidth || 4) * (1 - progress * 0.7));
          ctx.stroke();
          ctx.restore();
        } else if (pt.type === "feather") {
          // Fluttering feather physics
          if (pt.drag) {
            pt.vx *= pt.drag;
            pt.vy *= pt.drag;
          }
          if (pt.gravity) pt.vy += pt.gravity;
          pt.x += pt.vx + (pt.oscAmp ? Math.sin(pt.life * (pt.oscSpeed || 0.1)) * pt.oscAmp : 0);
          pt.y += pt.vy;
          if (pt.vAngle && pt.angle !== undefined) pt.angle += pt.vAngle;

          // Settle gently on ground
          if (pt.y > groundY - 2) {
            pt.y = groundY - 2;
            pt.vx *= 0.6;
            pt.vy = 0;
            pt.vAngle = 0;
          }

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.angle || 0);

          // Feather blade (ellipse)
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.ellipse(0, 0, pt.size * 2.2, pt.size * 0.75, 0, 0, Math.PI * 2);
          ctx.fill();

          // Central quill shaft
          ctx.strokeStyle = "rgba(255, 255, 255, 0.75)";
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(-pt.size * 1.8, 0);
          ctx.lineTo(pt.size * 1.8, 0);
          ctx.stroke();

          ctx.restore();
        } else if (pt.type === "spark") {
          // High-velocity impact spark streak
          if (pt.drag) {
            pt.vx *= pt.drag;
            pt.vy *= pt.drag;
          }
          pt.x += pt.vx;
          pt.y += pt.vy;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.strokeStyle = pt.color;
          ctx.lineWidth = pt.size;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(pt.x, pt.y);
          ctx.lineTo(pt.x - pt.vx * 2.5, pt.y - pt.vy * 2.5);
          ctx.stroke();
          ctx.restore();
        } else if (pt.type === "smoke") {
          // Soft smoke / wind puff
          if (pt.drag) {
            pt.vx *= pt.drag;
            pt.vy *= pt.drag;
          }
          pt.x += pt.vx;
          pt.y += pt.vy;
          pt.size += 0.35;

          ctx.save();
          ctx.globalAlpha = alpha * 0.6;
          ctx.fillStyle = pt.color;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else if (pt.type === "star") {
          // 4-pointed celestial sparkle
          if (pt.drag) {
            pt.vx *= pt.drag;
            pt.vy *= pt.drag;
          }
          if (pt.gravity) pt.vy += pt.gravity;
          pt.x += pt.vx;
          pt.y += pt.vy;
          if (pt.vAngle && pt.angle !== undefined) pt.angle += pt.vAngle;

          ctx.save();
          ctx.globalAlpha = alpha;
          ctx.translate(pt.x, pt.y);
          ctx.rotate(pt.angle || 0);
          ctx.fillStyle = pt.color;

          const s = pt.size;
          ctx.beginPath();
          ctx.moveTo(0, -s * 1.6);
          ctx.lineTo(s * 0.4, -s * 0.4);
          ctx.lineTo(s * 1.6, 0);
          ctx.lineTo(s * 0.4, s * 0.4);
          ctx.lineTo(0, s * 1.6);
          ctx.lineTo(-s * 0.4, s * 0.4);
          ctx.lineTo(-s * 1.6, 0);
          ctx.lineTo(-s * 0.4, -s * 0.4);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        }

        if (pt.life >= pt.maxLife) {
          g.particles.splice(i, 1);
        }
      }

      // Draw screen impact flash if active
      if (g.screenFlashAlpha > 0) {
        ctx.save();
        ctx.fillStyle = g.isDead ? "rgba(239, 68, 68, 0.4)" : "rgba(255, 255, 255, 0.35)";
        ctx.globalAlpha = g.screenFlashAlpha;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        g.screenFlashAlpha = Math.max(0, g.screenFlashAlpha - 0.035);
      }

      // 6. Draw Bird (only if alive!)
      if (!g.isDead) {
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
      }

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [phase, spawnPipe, finishGame]);

  // Trigger bird flap upwards
  const flapBird = useCallback((isSpaceFlap = false) => {
    gameStateRef.current.birdVy = isSpaceFlap ? -6.2 : -5.4; // Upward flap impulse

    // Spawn tiny white cloud/wind puff particle behind bird
    const count = isSpaceFlap ? 3 : 1;
    for (let i = 0; i < count; i++) {
      gameStateRef.current.particles.push({
        type: "smoke",
        x: 75,
        y: gameStateRef.current.birdY + 10 + (Math.random() - 0.5) * 8,
        vx: -2 - Math.random(),
        vy: 1.2 + (Math.random() - 0.5) * 2,
        color: "rgba(255, 255, 255, 0.85)",
        size: isSpaceFlap ? 5 : 4,
        life: 0,
        maxLife: 18,
      });
    }
  }, []);

  // Handle typing input
  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (phase !== "playing") return;
    const key = e.key;

    // Disregard non-character meta keys (Shift, Alt, Ctrl, etc.)
    if (key.length !== 1 && key !== "Backspace") return;
    e.preventDefault();

    // Trigger 'wing flap' audio clip whenever the user hits the Spacebar
    const isSpace = key === " " || e.code === "Space";
    if (isSpace) {
      SoundEffectsManager.playWingFlap();
      flapBird(true);
    }

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
      if (!isSpace) {
        sfx.key();
        flapBird(false);
      }
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
              type: "star",
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
      // If user tapped space for a wing flap impulse mid-word, flap smoothly without punishing as a fatal typo
      if (isSpace) {
        return;
      }
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

    const canvas = canvasRef.current;
    const height = canvas?.height || 340;
    gameStateRef.current.birdY = height * 0.45;
    gameStateRef.current.birdVy = 0;
    gameStateRef.current.birdAngle = 0;
    gameStateRef.current.isDead = false;
    gameStateRef.current.deathFrames = 0;
    gameStateRef.current.screenFlashAlpha = 0;
    gameStateRef.current.invulnerableFrames = 0;
    gameStateRef.current.particles = [];
    gameStateRef.current.pipes = [];
    if (canvas) {
      spawnPipe(canvas.width + 120, height);
    }

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
            <MuteButton variant="pill" />
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
            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span>
                  💡 <strong>Spacebar</strong> triggers wing flap swoosh!
                </span>
                <span className="hidden sm:inline">· Letters soar through obstacles</span>
              </span>
              <div className="flex items-center gap-3">
                <MuteButton variant="pill" />
                <button
                  type="button"
                  onClick={() => finishGame(lives)}
                  className="hover:text-foreground underline"
                >
                  End flight early
                </button>
              </div>
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

let ctx: AudioContext | null = null;
let muted = false;
const listeners = new Set<(isMuted: boolean) => void>();

const MUTE_KEY = "typefly-muted";

export function initSfx() {
  if (typeof window === "undefined") return;
  muted = window.localStorage.getItem(MUTE_KEY) === "1";
}

export function isMuted() {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
  }
  listeners.forEach((fn) => fn(muted));
}

export function toggleMute(): boolean {
  const next = !muted;
  setMuted(next);
  return next;
}

export function subscribeMute(callback: (isMuted: boolean) => void): () => void {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  try {
    const AudioContextConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextConstructor) {
      ctx ??= new AudioContextConstructor();
    }
    if (ctx && ctx.state === "suspended") {
      void ctx.resume();
    }
    return ctx;
  } catch {
    return null;
  }
}

function tone(freq: number, duration: number, type: OscillatorType, gain = 0.06, delay = 0) {
  if (muted) return;
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  try {
    const start = audioCtx.currentTime + delay;
    const osc = audioCtx.createOscillator();
    const vol = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    vol.gain.setValueAtTime(gain, start);
    vol.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(vol).connect(audioCtx.destination);
    osc.start(start);
    osc.stop(start + duration);
  } catch {
    /* audio unavailable */
  }
}

/**
 * Wing Flap Sound Effect:
 * Synthesizes an airy, swooshing down-sweep combined with a feather flutter
 * to simulate the quick displacement of air when bird wings flap.
 */
export function playWingFlap() {
  if (muted) return;
  const audioCtx = getAudioContext();
  if (!audioCtx) return;

  try {
    const now = audioCtx.currentTime;

    // 1. Air displacement swoosh (low-to-mid sweep through a gentle filter)
    const osc = audioCtx.createOscillator();
    const filter = audioCtx.createBiquadFilter();
    const gain = audioCtx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(380, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.13);

    filter.type = "lowpass";
    filter.frequency.setValueAtTime(550, now);
    filter.frequency.exponentialRampToValueAtTime(180, now + 0.13);

    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.12, now + 0.025);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.16);

    // 2. Feather flutter transient (crisp airy flutter)
    const flutterOsc = audioCtx.createOscillator();
    const flutterGain = audioCtx.createGain();

    flutterOsc.type = "triangle";
    flutterOsc.frequency.setValueAtTime(580, now + 0.015);
    flutterOsc.frequency.exponentialRampToValueAtTime(200, now + 0.09);

    flutterGain.gain.setValueAtTime(0.001, now + 0.015);
    flutterGain.gain.linearRampToValueAtTime(0.06, now + 0.035);
    flutterGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.11);

    flutterOsc.connect(flutterGain);
    flutterGain.connect(audioCtx.destination);

    flutterOsc.start(now + 0.015);
    flutterOsc.stop(now + 0.12);
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  key: () => tone(520 + Math.random() * 60, 0.05, "triangle", 0.035),
  flap: playWingFlap,
  wingFlap: playWingFlap,
  wrong: () => tone(150, 0.16, "sawtooth", 0.05),
  hit: () => {
    tone(130, 0.22, "sawtooth", 0.08);
    tone(90, 0.25, "square", 0.06, 0.05);
  },
  point: () => {
    tone(740, 0.08, "sine", 0.045);
    tone(980, 0.1, "sine", 0.04, 0.05);
  },
  word: () => {
    tone(660, 0.09, "sine", 0.05);
    tone(880, 0.1, "sine", 0.045, 0.07);
  },
  combo: () => {
    tone(880, 0.08, "square", 0.04);
    tone(1180, 0.1, "square", 0.035, 0.06);
  },
  heart: () => {
    tone(320, 0.2, "sawtooth", 0.06);
    tone(180, 0.28, "sawtooth", 0.05, 0.1);
  },
  start: () => {
    tone(520, 0.1, "sine", 0.05);
    tone(700, 0.12, "sine", 0.05, 0.1);
    tone(940, 0.16, "sine", 0.05, 0.22);
  },
  gameover: () => {
    tone(440, 0.25, "sawtooth", 0.06);
    tone(370, 0.25, "sawtooth", 0.06, 0.18);
    tone(290, 0.4, "sawtooth", 0.07, 0.36);
  },
  finish: () => {
    [660, 830, 990, 1320].forEach((f, i) => tone(f, 0.2, "triangle", 0.05, i * 0.12));
  },
};

/**
 * SoundEffectsManager:
 * Centralized manager for triggering audio clips and managing audio state.
 */
export class SoundEffectsManager {
  static init() {
    initSfx();
  }

  static isMuted(): boolean {
    return isMuted();
  }

  static setMuted(mutedState: boolean) {
    setMuted(mutedState);
  }

  static toggleMute(): boolean {
    return toggleMute();
  }

  static subscribe(callback: (isMuted: boolean) => void): () => void {
    return subscribeMute(callback);
  }

  static play(sound: keyof typeof sfx) {
    if (typeof sfx[sound] === "function") {
      sfx[sound]();
    }
  }

  static playWingFlap() {
    playWingFlap();
  }
}

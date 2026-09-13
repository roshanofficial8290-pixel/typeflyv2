let ctx: AudioContext | null = null;
let muted = false;

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
}

function tone(freq: number, duration: number, type: OscillatorType, gain = 0.06, delay = 0) {
  if (muted || typeof window === "undefined") return;
  try {
    const AudioContextConstructor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (AudioContextConstructor) {
      ctx ??= new AudioContextConstructor();
    }
    if (!ctx) return;
    if (ctx.state === "suspended") void ctx.resume();
    const start = ctx.currentTime + delay;
    const osc = ctx.createOscillator();
    const vol = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    vol.gain.setValueAtTime(gain, start);
    vol.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    osc.connect(vol).connect(ctx.destination);
    osc.start(start);
    osc.stop(start + duration);
  } catch {
    /* audio unavailable */
  }
}

export const sfx = {
  key: () => tone(520 + Math.random() * 60, 0.05, "triangle", 0.035),
  flap: () => {
    tone(420, 0.06, "sine", 0.04);
    tone(620, 0.07, "triangle", 0.03, 0.02);
  },
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

import { getSettings, saveSettings, type Settings } from './progress';
import { speechLang } from './i18n';
import { speed } from './scope';

// Synthesised sound effects (Web Audio) plus a speechSynthesis wrapper.
// Nothing here may throw: audio is a bonus, never a requirement.

export type Sfx = 'tap' | 'pick' | 'drop' | 'chime' | 'oops' | 'step' | 'bump' | 'win' | 'sticker';

let ctx: AudioContext | null = null;
let settings: Settings = getSettings();
let lastInstruction: Line[] = [];
let lastDone: (() => void) | undefined;
/** Bumped by every new line or narration, so stale ones stop. */
let generation = 0;
let pointed: HTMLElement[] = [];
let narrationTimer: ReturnType<typeof setTimeout> | undefined;
let voices: SpeechSynthesisVoice[] = [];
const captionListeners = new Set<(text: string) => void>();
const muteListeners = new Set<(muted: boolean) => void>();

function synth(): SpeechSynthesis | null {
  try {
    return typeof speechSynthesis !== 'undefined' ? speechSynthesis : null;
  } catch {
    return null;
  }
}

function refreshVoices(): void {
  try {
    voices = synth()?.getVoices() ?? [];
  } catch {
    voices = [];
  }
}

export function initAudio(): void {
  refreshVoices();
  const s = synth();
  try {
    s?.addEventListener('voiceschanged', refreshVoices);
  } catch {
    // Old browsers without EventTarget on speechSynthesis.
  }
}

/**
 * Must run inside a user gesture (the "Tap to start" handler). iOS only allows
 * audio and speech once a gesture has created/resumed them.
 */
export function unlock(): void {
  try {
    const AC =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!ctx && AC) ctx = new AC();
    if (ctx) {
      void ctx.resume().catch(() => undefined);
      const buf = ctx.createBuffer(1, 1, 22050);
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.connect(ctx.destination);
      src.start(0);
    }
  } catch {
    ctx = null;
  }
  try {
    const s = synth();
    if (s) {
      const u = new SpeechSynthesisUtterance(' ');
      u.volume = 0;
      s.speak(u);
    }
  } catch {
    // no speech on this device
  }
  refreshVoices();
}

// ---- sound effects -------------------------------------------------------

function tone(
  freq: number,
  at: number,
  dur: number,
  type: OscillatorType = 'sine',
  gain = 0.12,
  slideTo?: number,
): void {
  if (!ctx) return;
  const t0 = ctx.currentTime + at;
  const osc = ctx.createOscillator();
  const g = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.012);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  osc.connect(g).connect(ctx.destination);
  osc.start(t0);
  osc.stop(t0 + dur + 0.02);
}

const SFX: Record<Sfx, () => void> = {
  tap: () => tone(660, 0, 0.08, 'triangle', 0.1),
  pick: () => tone(520, 0, 0.1, 'triangle', 0.1, 780),
  drop: () => tone(780, 0, 0.12, 'triangle', 0.12, 420),
  chime: () => {
    tone(784, 0, 0.18);
    tone(1046, 0.09, 0.25);
  },
  // Gentle "hmm" slide, never a buzzer.
  oops: () => tone(440, 0, 0.32, 'sine', 0.1, 300),
  step: () => tone(240, 0, 0.07, 'triangle', 0.14, 180),
  bump: () => tone(200, 0, 0.18, 'sine', 0.12, 150),
  win: () => [523, 659, 784, 1046].forEach((f, i) => tone(f, i * 0.09, 0.22)),
  sticker: () => [784, 988, 1175, 1568, 1175, 1568].forEach((f, i) => tone(f, i * 0.08, 0.2)),
};

export function sfx(name: Sfx): void {
  if (settings.muted || !ctx) return;
  try {
    if (ctx.state === 'suspended') void ctx.resume().catch(() => undefined);
    SFX[name]();
  } catch {
    // ignore
  }
}

// ---- speech ---------------------------------------------------------------

const PREFERRED = [
  'samantha',
  'karen',
  'moira',
  'tessa',
  'google us english',
  'google uk english female',
  'microsoft aria',
  'microsoft jenny',
  'microsoft zira',
];

/** Ranks the device's voices for a language and returns the friendliest one. Pure. */
export function pickVoice<
  V extends Pick<SpeechSynthesisVoice, 'lang' | 'name' | 'voiceURI' | 'localService'>,
>(list: readonly V[], lang: string, preferredURI = ''): V | null {
  if (preferredURI) {
    const chosen = list.find((v) => v.voiceURI === preferredURI);
    if (chosen) return chosen;
  }
  const want = lang.toLowerCase();
  const base = want.split('-')[0] ?? want;
  let best: V | null = null;
  let bestScore = -1;
  for (const v of list) {
    const vl = v.lang.toLowerCase().replace('_', '-');
    if (!vl.startsWith(base)) continue;
    let score = 1;
    if (vl === want) score += 4;
    const name = v.name.toLowerCase();
    const rank = PREFERRED.findIndex((p) => name.includes(p));
    if (rank >= 0) score += 20 - rank;
    if (v.localService) score += 2;
    if (score > bestScore) {
      best = v;
      bestScore = score;
    }
  }
  return best;
}

export function availableVoices(): SpeechSynthesisVoice[] {
  refreshVoices();
  const base = speechLang().split('-')[0] ?? 'en';
  return voices.filter((v) => v.lang.toLowerCase().startsWith(base));
}

/** One spoken line. While it plays, `point` glows with a bouncing finger. */
export interface Line {
  text: string;
  point?: Element | null | (Element | null | undefined)[];
}

function utter(text: string, onDone?: () => void): void {
  const s = synth();
  if (!s || settings.muted) return;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.rate = settings.rate;
    u.pitch = 1.15;
    u.lang = speechLang();
    const v = pickVoice(voices, u.lang, settings.voiceURI);
    if (v) u.voice = v;
    if (onDone) {
      u.onend = onDone;
      u.onerror = onDone;
    }
    s.speak(u);
  } catch {
    onDone?.();
  }
}

function clearPointing(): void {
  pointed.forEach((el) => el.classList.remove('is-pointed'));
  pointed = [];
}

function pointAt(target: Line['point']): void {
  clearPointing();
  const list = Array.isArray(target) ? target : [target];
  pointed = list.filter((el): el is HTMLElement => el instanceof HTMLElement);
  pointed.forEach((el) => el.classList.add('is-pointed'));
}

/** Rough time a line takes to say, used when speech is off or its events never fire. */
const estimate = (text: string) => ((text.length * 75) / settings.rate + 900) * speed;

/**
 * Says lines one after another for children who can't read: each line shows as
 * the caption, and whatever it talks about glows with a 👆 while it is spoken.
 * Instructions (the default) can be replayed with the speaker button. `onDone` runs
 * after the last line, unless another line interrupts first.
 */
export function narrate(lines: Line[], instruction = true, onDone?: () => void): void {
  if (!lines.length) return;
  if (instruction) {
    lastInstruction = lines;
    lastDone = onDone;
  }
  hush();
  const gen = generation;
  const step = (i: number) => {
    if (gen !== generation) return;
    const line = lines[i];
    if (!line) {
      narrationTimer = setTimeout(() => gen === generation && clearPointing(), 900 * speed);
      onDone?.();
      return;
    }
    pointAt(line.point);
    captionListeners.forEach((fn) => fn(line.text));
    let advanced = false;
    const next = () => {
      if (advanced) return;
      advanced = true;
      clearTimeout(narrationTimer);
      step(i + 1);
    };
    // Speech end moves on; the timer is a safety net (and the pace when muted).
    narrationTimer = setTimeout(next, estimate(line.text) * (synth() && !settings.muted ? 1.6 : 1));
    utter(line.text, speed < 1 ? undefined : next);
  };
  step(0);
}

/** Speaks a single line and shows it as a caption. */
export function say(text: string, instruction = false): void {
  narrate([{ text }], instruction);
}

export function replay(): void {
  if (lastInstruction.length) narrate(lastInstruction, true, lastDone);
}

/** Stops any speech or narration and clears pointing. `forget` also drops the replayable instruction. */
export function hush(forget = false): void {
  if (forget) {
    lastInstruction = [];
    lastDone = undefined;
  }
  generation++;
  clearTimeout(narrationTimer);
  clearPointing();
  stopSpeech();
}

export function stopSpeech(): void {
  try {
    synth()?.cancel();
  } catch {
    // ignore
  }
}

export function onCaption(fn: (text: string) => void): () => void {
  captionListeners.add(fn);
  return () => captionListeners.delete(fn);
}

// ---- settings -------------------------------------------------------------

export const isMuted = (): boolean => settings.muted;

export function setMuted(muted: boolean): void {
  settings = { ...settings, muted };
  saveSettings(settings);
  if (muted) stopSpeech();
  muteListeners.forEach((fn) => fn(muted));
}

export function onMute(fn: (muted: boolean) => void): () => void {
  muteListeners.add(fn);
  return () => muteListeners.delete(fn);
}

export function getVoiceSettings(): Pick<Settings, 'voiceURI' | 'rate'> {
  return { voiceURI: settings.voiceURI, rate: settings.rate };
}

export function setVoiceSettings(v: Partial<Pick<Settings, 'voiceURI' | 'rate'>>): void {
  settings = { ...settings, ...v };
  saveSettings(settings);
}

export function reloadSettings(): void {
  settings = getSettings();
}

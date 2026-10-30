import { load, remove, save } from './storage';

export type LevelId = 'teach' | 'program' | 'safety';

export interface Progress {
  stickers: Record<LevelId, number>;
  /** Completed Teach rounds, used to rotate themes on replay. */
  teachPlays: number;
  /** Index of the next Program puzzle, so a return trip resumes. */
  programPuzzle: number;
}

export interface Settings {
  muted: boolean;
  voiceURI: string;
  rate: number;
}

const fresh = (): Progress => ({
  stickers: { teach: 0, program: 0, safety: 0 },
  teachPlays: 0,
  programPuzzle: 0,
});

export function getProgress(): Progress {
  const p = load<Partial<Progress>>('progress', {});
  const base = fresh();
  return {
    stickers: { ...base.stickers, ...(p.stickers ?? {}) },
    teachPlays: typeof p.teachPlays === 'number' ? p.teachPlays : 0,
    programPuzzle: typeof p.programPuzzle === 'number' ? p.programPuzzle : 0,
  };
}

export function updateProgress(fn: (p: Progress) => void): Progress {
  const p = getProgress();
  fn(p);
  save('progress', p);
  return p;
}

export function resetProgress(): void {
  remove('progress');
}

export function getSettings(): Settings {
  const s = load<Partial<Settings>>('settings', {});
  return {
    muted: s.muted === true,
    voiceURI: typeof s.voiceURI === 'string' ? s.voiceURI : '',
    rate: typeof s.rate === 'number' ? s.rate : 0.9,
  };
}

export function saveSettings(s: Settings): void {
  save('settings', s);
}

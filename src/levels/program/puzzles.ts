import type { Dir, Grid } from './interpreter';

export const MAX_SLOTS = 8;

export interface Puzzle extends Grid {
  /** 'fix' puzzles start with a pre-filled program containing one bad step. */
  kind: 'build' | 'fix';
  program?: readonly Dir[];
}

export const PUZZLES: readonly Puzzle[] = [
  // 1. One step
  { kind: 'build', size: 4, start: { x: 0, y: 1 }, goal: { x: 1, y: 1 }, walls: [] },
  // 2. Two steps
  { kind: 'build', size: 4, start: { x: 0, y: 2 }, goal: { x: 2, y: 2 }, walls: [] },
  // 3. Around a corner
  { kind: 'build', size: 4, start: { x: 0, y: 1 }, goal: { x: 2, y: 2 }, walls: [] },
  // 4. Around an obstacle
  { kind: 'build', size: 4, start: { x: 0, y: 1 }, goal: { x: 2, y: 1 }, walls: [{ x: 1, y: 1 }] },
  // 5. Fix the broken program (step 2 walks off the top)
  {
    kind: 'fix',
    size: 4,
    start: { x: 0, y: 0 },
    goal: { x: 3, y: 0 },
    walls: [],
    program: ['right', 'up', 'right'],
  },
  // 6. Bigger board, longer path
  {
    kind: 'build',
    size: 5,
    start: { x: 0, y: 0 },
    goal: { x: 3, y: 3 },
    walls: [
      { x: 1, y: 1 },
      { x: 2, y: 2 },
    ],
  },
  // 7. Fix the broken program (step 2 bumps the rock)
  {
    kind: 'fix',
    size: 5,
    start: { x: 0, y: 4 },
    goal: { x: 3, y: 2 },
    walls: [
      { x: 1, y: 3 },
      { x: 1, y: 4 },
    ],
    program: ['up', 'right', 'right', 'right', 'right'],
  },
  // 8. Around a wall
  {
    kind: 'build',
    size: 5,
    start: { x: 0, y: 2 },
    goal: { x: 4, y: 2 },
    walls: [
      { x: 2, y: 1 },
      { x: 2, y: 2 },
    ],
  },
];

/** Zero-based puzzle indexes after which a sticker is awarded (puzzles 4 and 8). */
export const STICKER_AFTER: ReadonlySet<number> = new Set([3, 7]);

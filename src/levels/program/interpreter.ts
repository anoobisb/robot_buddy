// Pure interpreter for Bolt's grid programs.

export type Dir = 'up' | 'down' | 'left' | 'right';
/** A tile in the program row: a step, or a 🔁 that repeats the steps before it. */
export type Cmd = Dir | 'repeat';

export interface Pos {
  x: number;
  y: number;
}

export interface Grid {
  size: number;
  start: Pos;
  goal: Pos;
  walls: readonly Pos[];
}

export type Outcome = 'reached_goal' | 'hit_wall' | 'ran_out';

export interface RunResult {
  /** states[0] is the start; states[i + 1] is Bolt's position after step i. */
  states: Pos[];
  result: Outcome;
  /** Step that went wrong: the bumping step, or program.length when steps ran out. */
  failedStep: number | null;
}

export const DELTA: Record<Dir, Pos> = {
  up: { x: 0, y: -1 },
  down: { x: 0, y: 1 },
  left: { x: -1, y: 0 },
  right: { x: 1, y: 0 },
};

const same = (a: Pos, b: Pos) => a.x === b.x && a.y === b.y;

export function isBlocked(grid: Grid, p: Pos): boolean {
  return (
    p.x < 0 || p.y < 0 || p.x >= grid.size || p.y >= grid.size || grid.walls.some((w) => same(w, p))
  );
}

export function run(grid: Grid, program: readonly Dir[]): RunResult {
  let pos = { ...grid.start };
  const states: Pos[] = [pos];
  for (let i = 0; i < program.length; i++) {
    const d = DELTA[program[i]!];
    const next = { x: pos.x + d.x, y: pos.y + d.y };
    if (isBlocked(grid, next)) return { states, result: 'hit_wall', failedStep: i };
    pos = next;
    states.push(pos);
    if (same(pos, grid.goal)) return { states, result: 'reached_goal', failedStep: null };
  }
  return { states, result: 'ran_out', failedStep: program.length };
}

/**
 * Unrolls 🔁 tiles: each one does every step since the previous 🔁 (or the start)
 * one more time. `from` maps each step back to the tile that produced it.
 */
export function expand(cmds: readonly Cmd[]): { steps: Dir[]; from: number[] } {
  const steps: Dir[] = [];
  const from: number[] = [];
  let segment = 0;
  cmds.forEach((c, i) => {
    if (c === 'repeat') {
      const end = steps.length;
      for (let j = segment; j < end; j++) {
        steps.push(steps[j]!);
        from.push(from[j]!);
      }
      segment = steps.length;
    } else {
      steps.push(c);
      from.push(i);
    }
  });
  return { steps, from };
}

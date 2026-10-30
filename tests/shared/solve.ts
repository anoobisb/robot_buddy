import {
  DELTA,
  expand,
  isBlocked,
  run,
  type Cmd,
  type Dir,
  type Grid,
} from '../../src/levels/program/interpreter';
import { MAX_SLOTS, type Puzzle } from '../../src/levels/program/puzzles';

/** Shortest path to the goal by breadth-first search, or null if unreachable. */
export function solve(grid: Grid): Dir[] | null {
  const key = (p: { x: number; y: number }) => `${p.x},${p.y}`;
  const queue: { p: { x: number; y: number }; path: Dir[] }[] = [{ p: grid.start, path: [] }];
  const seen = new Set([key(grid.start)]);
  while (queue.length) {
    const { p, path } = queue.shift()!;
    if (p.x === grid.goal.x && p.y === grid.goal.y) return path;
    for (const d of Object.keys(DELTA) as Dir[]) {
      const n = { x: p.x + DELTA[d].x, y: p.y + DELTA[d].y };
      if (isBlocked(grid, n) || seen.has(key(n))) continue;
      seen.add(key(n));
      queue.push({ p: n, path: [...path, d] });
    }
  }
  return null;
}

/** Shortest list of tiles (arrows and 🔁) that fits the puzzle's row and reaches the goal. */
export function solveTiles(p: Puzzle): Cmd[] | null {
  const limit = p.slots ?? MAX_SLOTS;
  if (!p.repeat) {
    const path = solve(p);
    return path && path.length <= limit ? path : null;
  }
  const alphabet: Cmd[] = [...(p.palette ?? (Object.keys(DELTA) as Dir[])), 'repeat'];
  let frontier: Cmd[][] = [[]];
  for (let len = 1; len <= limit; len++) {
    const next: Cmd[][] = [];
    for (const prefix of frontier) {
      for (const c of alphabet) {
        const cmds = [...prefix, c];
        if (run(p, expand(cmds).steps).result === 'reached_goal') return cmds;
        next.push(cmds);
      }
    }
    frontier = next;
  }
  return null;
}

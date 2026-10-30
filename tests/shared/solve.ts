import { DELTA, isBlocked, type Dir, type Grid } from '../../src/levels/program/interpreter';

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

import { describe, expect, it } from 'vitest';
import { DELTA, isBlocked, run, type Dir, type Grid } from '../../src/levels/program/interpreter';
import { solve } from '../shared/solve';
import { MAX_SLOTS, PUZZLES, STICKER_AFTER } from '../../src/levels/program/puzzles';

const open: Grid = {
  size: 4,
  start: { x: 0, y: 0 },
  goal: { x: 2, y: 1 },
  walls: [{ x: 1, y: 1 }],
};

describe('interpreter', () => {
  it('reaches the goal and records every state', () => {
    const r = run(open, ['right', 'right', 'down']);
    expect(r.result).toBe('reached_goal');
    expect(r.failedStep).toBeNull();
    expect(r.states).toEqual([
      { x: 0, y: 0 },
      { x: 1, y: 0 },
      { x: 2, y: 0 },
      { x: 2, y: 1 },
    ]);
  });

  it('stops as soon as the goal is reached', () => {
    const r = run(open, ['right', 'right', 'down', 'down']);
    expect(r.result).toBe('reached_goal');
    expect(r.states).toHaveLength(4);
  });

  it('reports hitting the edge with the failing step', () => {
    const r = run(open, ['right', 'up']);
    expect(r.result).toBe('hit_wall');
    expect(r.failedStep).toBe(1);
    expect(r.states.at(-1)).toEqual({ x: 1, y: 0 });
  });

  it('reports hitting an obstacle', () => {
    const r = run(open, ['down', 'right']);
    expect(r.result).toBe('hit_wall');
    expect(r.failedStep).toBe(1);
  });

  it('reports running out of steps', () => {
    expect(run(open, ['right'])).toMatchObject({ result: 'ran_out', failedStep: 1 });
    expect(run(open, [])).toMatchObject({ result: 'ran_out', failedStep: 0 });
  });
});

describe('puzzles', () => {
  it('has 8 puzzles with stickers after 4 and 8', () => {
    expect(PUZZLES).toHaveLength(8);
    expect([...STICKER_AFTER]).toEqual([3, 7]);
  });

  it('starts at 4x4 and grows to 5x5', () => {
    expect(PUZZLES[0]!.size).toBe(4);
    expect(PUZZLES.at(-1)!.size).toBe(5);
  });

  it.each(PUZZLES.map((p, i) => [i + 1, p] as const))(
    'puzzle %i is solvable within the slots',
    (_n, p) => {
      expect(isBlocked(p, p.start)).toBe(false);
      expect(isBlocked(p, p.goal)).toBe(false);
      const path = solve(p);
      expect(path).not.toBeNull();
      expect(path!.length).toBeLessThanOrEqual(MAX_SLOTS);
      expect(run(p, path!).result).toBe('reached_goal');
    },
  );

  it('progresses: 1 step, 2 steps, a corner, then an obstacle', () => {
    expect(solve(PUZZLES[0]!)).toHaveLength(1);
    expect(solve(PUZZLES[1]!)).toHaveLength(2);
    expect(new Set(solve(PUZZLES[2]!)).size).toBe(2);
    expect(PUZZLES[3]!.walls.length).toBeGreaterThan(0);
  });

  it('has exactly two fix-the-program puzzles', () => {
    expect(PUZZLES.filter((p) => p.kind === 'fix')).toHaveLength(2);
  });

  it.each(PUZZLES.flatMap((p, i) => (p.kind === 'fix' ? [[i + 1, p] as const] : [])))(
    'fix puzzle %i: the bug shows at the bad step, and replacing it fixes the program',
    (_n, p) => {
      const program = p.program!;
      const r = run(p, program);
      expect(r.result).toBe('hit_wall');
      const bad = r.failedStep!;
      const fixes = (Object.keys(DELTA) as Dir[]).filter((d) => {
        const fixed = [...program];
        fixed[bad] = d;
        return run(p, fixed).result === 'reached_goal';
      });
      expect(fixes.length).toBeGreaterThan(0);
    },
  );
});

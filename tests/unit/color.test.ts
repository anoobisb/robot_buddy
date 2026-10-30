import { describe, expect, it } from 'vitest';
import { BLANK, PAGES, SWATCHES, suggestFills } from '../../src/levels/color/pages';

const regionIds = (svg: string) =>
  [...svg.matchAll(/class="region" data-r="(\w+)"/g)].map((m) => m[1]);

describe('coloring pages', () => {
  it.each(PAGES.map((p) => [p.id, p] as const))('%s has 10+ uniquely named regions', (_id, p) => {
    const ids = regionIds(p.svg);
    expect(ids.length).toBeGreaterThanOrEqual(10);
    expect(new Set(ids).size).toBe(ids.length);
    expect(p.svg).not.toMatch(/href=|<script|<image/);
  });

  it('offers seven colors and an eraser', () => {
    expect(SWATCHES).toHaveLength(8);
    expect(SWATCHES.at(-1)).toMatchObject({ id: 'eraser', color: BLANK });
  });
});

describe("Bolt's suggested fills", () => {
  it('needs examples first', () => {
    expect(suggestFills([], ['a', 'b'])).toEqual({});
    expect(suggestFills([BLANK, BLANK], ['a'])).toEqual({});
  });

  it('uses only the colors the child used, favourite first', () => {
    const plan = suggestFills(['red', 'blue', 'blue', BLANK], ['a', 'b', 'c', 'd']);
    expect(Object.values(plan).every((c) => c === 'red' || c === 'blue')).toBe(true);
    expect(plan.a).toBe('blue');
    expect(Object.values(plan).filter((c) => c === 'blue').length).toBeGreaterThan(
      Object.values(plan).filter((c) => c === 'red').length,
    );
  });

  it('fills every blank and is deterministic', () => {
    const blanks = ['a', 'b', 'c', 'd', 'e'];
    const plan = suggestFills(['green'], blanks);
    expect(Object.keys(plan)).toEqual(blanks);
    expect(suggestFills(['green'], blanks)).toEqual(plan);
  });
});

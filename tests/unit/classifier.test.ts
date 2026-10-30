import { describe, expect, it } from 'vitest';
import { classify, distance, kFor, seedFrom } from '../../src/levels/teach/classifier';
import { THEMES, itemById, themeForPlay } from '../../src/levels/teach/items';
import { simulate, toExample } from '../../src/levels/teach/session';

describe('classifier', () => {
  it('measures Euclidean distance', () => {
    expect(distance([0, 0], [3, 4])).toBe(5);
  });

  it('uses k=1 below six examples and k=3 from six', () => {
    expect(kFor(5)).toBe(1);
    expect(kFor(6)).toBe(3);
  });

  it('flips a seeded coin when a class has no examples', () => {
    const only = [{ features: [1, 1], label: 'yes' as const }];
    const a = classify(only, [0, 0], seedFrom('x'));
    const b = classify(only, [0, 0], seedFrom('x'));
    expect(a.coinFlip).toBe(true);
    expect(a).toEqual(b);
    expect(classify([], [0, 0], 2).label).toBe('yes');
    expect(classify([], [0, 0], 3).label).toBe('no');
  });

  it('picks the nearest example with k=1', () => {
    const ex = [
      { features: [0, 0], label: 'no' as const },
      { features: [1, 1], label: 'yes' as const },
    ];
    expect(classify(ex, [0.9, 0.8], 0).label).toBe('yes');
    expect(classify(ex, [0.1, 0.2], 0).label).toBe('no');
  });
});

describe('dataset', () => {
  it('has at least 24 items across 3 themes', () => {
    expect(THEMES).toHaveLength(3);
    expect(THEMES.reduce((n, th) => n + th.items.length, 0)).toBeGreaterThanOrEqual(24);
  });

  it('uses every item exactly once in the scripted rounds', () => {
    for (const theme of THEMES) {
      const used = theme.rounds.flatMap((r) => [...r.teach, ...r.test]);
      expect(new Set(used).size).toBe(used.length);
      expect(used.sort()).toEqual(theme.items.map((i) => i.id).sort());
      for (const item of theme.items) {
        expect(item.f).toHaveLength(theme.features.length);
        item.f.forEach((v) => expect(v).toBeGreaterThanOrEqual(0));
        item.f.forEach((v) => expect(v).toBeLessThanOrEqual(1));
      }
    }
  });

  it('teaches one example of each class per round', () => {
    for (const theme of THEMES) {
      for (const round of theme.rounds) {
        const labels = round.teach.map((id) => itemById(theme, id).label).sort();
        expect(labels).toEqual(['no', 'yes']);
      }
    }
  });

  it('rotates themes on replay', () => {
    expect(themeForPlay(0).id).toBe('fruit');
    expect(themeForPlay(1).id).toBe('animal');
    expect(themeForPlay(2).id).toBe('fly');
    expect(themeForPlay(3).id).toBe('fruit');
  });
});

describe.each(THEMES.map((th) => [th.id, th] as const))('accuracy curve: %s', (_id, theme) => {
  const { rounds, examples } = simulate(theme);
  const accuracy = rounds.map((r) => r.guesses.filter((g) => g.correct).length / r.guesses.length);

  it('runs three rounds, adding two examples per round (N = 2, 4, 6...)', () => {
    expect(rounds).toHaveLength(3);
    expect(rounds[0]!.examplesBefore).toBe(2);
  });

  it('gets a tricky item wrong with only 2 examples', () => {
    const wrong = rounds[0]!.guesses.filter((g) => !g.correct).map((g) => g.id);
    expect(wrong.length).toBeGreaterThan(0);
    expect(wrong.some((id) => itemById(theme, id).tricky)).toBe(true);
  });

  it('gets everything right in round 3, with 6 or more examples', () => {
    expect(rounds[2]!.examplesBefore).toBeGreaterThanOrEqual(6);
    expect(rounds[2]!.guesses.every((g) => g.correct)).toBe(true);
  });

  it('never gets worse from round to round', () => {
    expect(accuracy[1]!).toBeGreaterThanOrEqual(accuracy[0]!);
    expect(accuracy[2]!).toBeGreaterThanOrEqual(accuracy[1]!);
    expect(accuracy[2]).toBe(1);
  });

  it('with the final examples, classifies every non-tricky item correctly', () => {
    for (const item of theme.items.filter((i) => !i.tricky)) {
      const guess = classify(examples, item.f, 0);
      expect(guess.label, item.id).toBe(item.label);
    }
  });

  it('with only the first round of examples, is fooled by tricky items', () => {
    const two = theme.rounds[0]!.teach.map((id) => toExample(itemById(theme, id)));
    const tricky = theme.items.filter((i) => i.tricky);
    const fooled = tricky.filter((i) => classify(two, i.f, 0).label !== i.label);
    expect(fooled.length).toBeGreaterThan(0);
  });
});

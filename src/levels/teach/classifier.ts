// A real, tiny k-nearest-neighbours classifier. Pure and deterministic.

export type Label = 'yes' | 'no';

export interface Example {
  features: readonly number[];
  label: Label;
}

export interface Guess {
  label: Label;
  /** True when Bolt had no examples of one of the classes and had to flip a coin. */
  coinFlip: boolean;
}

export function distance(a: readonly number[], b: readonly number[]): number {
  let sum = 0;
  for (let i = 0; i < Math.max(a.length, b.length); i++) {
    const d = (a[i] ?? 0) - (b[i] ?? 0);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

/** k=1 while Bolt has seen only a few examples, k=3 once it has six or more. */
export const kFor = (exampleCount: number): number => (exampleCount >= 6 ? 3 : 1);

/** Small string hash so the "coin flip" is seeded and repeatable. */
export function seedFrom(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function classify(
  examples: readonly Example[],
  features: readonly number[],
  seed: number,
): Guess {
  const hasYes = examples.some((e) => e.label === 'yes');
  const hasNo = examples.some((e) => e.label === 'no');
  if (!hasYes || !hasNo) {
    return { label: seed % 2 === 0 ? 'yes' : 'no', coinFlip: true };
  }
  const k = kFor(examples.length);
  // Stable sort: ties go to the earlier example.
  const nearest = examples
    .map((e, i) => ({ e, i, d: distance(e.features, features) }))
    .sort((a, b) => a.d - b.d || a.i - b.i)
    .slice(0, k);
  const yes = nearest.filter((n) => n.e.label === 'yes').length;
  const no = nearest.length - yes;
  let label: Label;
  if (yes !== no) label = yes > no ? 'yes' : 'no';
  else label = nearest[0]!.e.label;
  return { label, coinFlip: false };
}

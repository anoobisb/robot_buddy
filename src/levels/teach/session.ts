import { classify, seedFrom, type Example, type Guess } from './classifier';
import { itemById, type Item, type Theme } from './items';

/** Bolt's guess for an item, seeded by the item and how much Bolt has seen. */
export function guessFor(examples: readonly Example[], item: Item): Guess {
  return classify(examples, item.f, seedFrom(`${item.id}:${examples.length}`));
}

export const toExample = (item: Item): Example => ({ features: item.f, label: item.label });

export interface RoundResult {
  examplesBefore: number;
  guesses: { id: string; correct: boolean }[];
}

/**
 * Plays the scripted order the scene uses: teach items become examples, and every
 * wrong guess is corrected by the child, adding one more example.
 */
export function simulate(theme: Theme): { rounds: RoundResult[]; examples: Example[] } {
  const examples: Example[] = [];
  const rounds: RoundResult[] = [];
  for (const round of theme.rounds) {
    for (const id of round.teach) examples.push(toExample(itemById(theme, id)));
    const result: RoundResult = { examplesBefore: examples.length, guesses: [] };
    for (const id of round.test) {
      const item = itemById(theme, id);
      const correct = guessFor(examples, item).label === item.label;
      result.guesses.push({ id, correct });
      if (!correct) examples.push(toExample(item));
    }
    rounds.push(result);
  }
  return { rounds, examples };
}

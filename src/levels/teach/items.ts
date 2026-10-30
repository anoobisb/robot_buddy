import type { Label } from './classifier';

export interface Item {
  id: string;
  emoji: string;
  /** Hidden true label. */
  label: Label;
  /** Hand-authored features in 0..1, meaning given by the theme's `features`. */
  f: readonly number[];
  /** Designed to fool Bolt while it has only a few examples. */
  tricky?: boolean;
}

export interface Round {
  /** Items the child sorts into the bins (each becomes a labelled example). */
  teach: readonly string[];
  /** Items Bolt guesses about. */
  test: readonly string[];
}

export type ThemeId = 'fruit' | 'animal' | 'fly';

export interface Theme {
  id: ThemeId;
  features: readonly string[];
  yesIcon: string;
  noIcon: string;
  items: readonly Item[];
  rounds: readonly Round[];
}

const fruit: Theme = {
  id: 'fruit',
  features: ['round', 'sweet', 'soft', 'hard', 'brown', 'growsOnPlant'],
  yesIcon: '🍎',
  noIcon: '⚽',
  items: [
    { id: 'banana', emoji: '🍌', label: 'yes', f: [0, 0.9, 0.7, 0, 0, 1] },
    { id: 'rock', emoji: '🪨', label: 'no', f: [0.8, 0, 0, 1, 0.8, 0] },
    { id: 'pear', emoji: '🍐', label: 'yes', f: [0.7, 0.8, 0.4, 0.3, 0, 1] },
    { id: 'coconut', emoji: '🥥', label: 'yes', f: [1, 0.3, 0, 1, 1, 1], tricky: true },
    { id: 'strawberry', emoji: '🍓', label: 'yes', f: [0.6, 1, 0.8, 0, 0, 1] },
    { id: 'ball', emoji: '🏀', label: 'no', f: [1, 0, 0.4, 0.4, 0, 0] },
    { id: 'tomato', emoji: '🍅', label: 'yes', f: [1, 0.2, 0.7, 0, 0, 1], tricky: true },
    { id: 'teddy', emoji: '🧸', label: 'no', f: [0.5, 0, 1, 0, 1, 0] },
    { id: 'grapes', emoji: '🍇', label: 'yes', f: [0.9, 0.9, 0.8, 0, 0, 1] },
    { id: 'car', emoji: '🚗', label: 'no', f: [0, 0, 0, 1, 0, 0] },
    { id: 'orange', emoji: '🍊', label: 'yes', f: [1, 0.8, 0.5, 0.2, 0, 1] },
    { id: 'shoe', emoji: '👟', label: 'no', f: [0, 0, 0.5, 0.4, 0, 0] },
    { id: 'cookie', emoji: '🍪', label: 'no', f: [1, 0.9, 0.3, 0.5, 1, 0], tricky: true },
  ],
  rounds: [
    { teach: ['banana', 'rock'], test: ['pear', 'coconut'] },
    { teach: ['strawberry', 'ball'], test: ['tomato', 'teddy'] },
    { teach: ['grapes', 'car'], test: ['orange', 'shoe', 'cookie'] },
  ],
};

const animal: Theme = {
  id: 'animal',
  features: ['alive', 'furry', 'legs', 'wheels', 'plastic', 'eyes'],
  yesIcon: '🐾',
  noIcon: '🎲',
  items: [
    { id: 'dog', emoji: '🐶', label: 'yes', f: [1, 1, 1, 0, 0, 1] },
    { id: 'toycar', emoji: '🚗', label: 'no', f: [0, 0, 0, 1, 1, 0.3] },
    { id: 'cat', emoji: '🐱', label: 'yes', f: [1, 1, 1, 0, 0, 1] },
    { id: 'teddy', emoji: '🧸', label: 'no', f: [0, 1, 1, 0, 0, 1], tricky: true },
    { id: 'fish', emoji: '🐟', label: 'yes', f: [1, 0, 0, 0, 0, 1] },
    { id: 'ball', emoji: '⚽', label: 'no', f: [0, 0, 0, 0, 1, 0] },
    { id: 'robot', emoji: '🤖', label: 'no', f: [0, 0, 1, 0, 1, 1], tricky: true },
    { id: 'frog', emoji: '🐸', label: 'yes', f: [1, 0, 1, 0, 0, 1] },
    { id: 'rabbit', emoji: '🐰', label: 'yes', f: [1, 1, 1, 0, 0, 1] },
    { id: 'kite', emoji: '🪁', label: 'no', f: [0, 0, 0, 0, 1, 0] },
    { id: 'lion', emoji: '🦁', label: 'yes', f: [1, 1, 1, 0, 0, 1] },
    { id: 'yoyo', emoji: '🪀', label: 'no', f: [0, 0, 0, 0, 1, 0] },
    { id: 'duck', emoji: '🦆', label: 'yes', f: [1, 0.3, 1, 0, 0, 1] },
  ],
  rounds: [
    { teach: ['dog', 'toycar'], test: ['cat', 'teddy'] },
    { teach: ['fish', 'ball'], test: ['robot', 'frog'] },
    { teach: ['rabbit', 'kite'], test: ['lion', 'yoyo', 'duck'] },
  ],
};

const fly: Theme = {
  id: 'fly',
  features: ['wings', 'feathers', 'furry', 'legs', 'metal', 'big', 'swims'],
  yesIcon: '☁️',
  noIcon: '🌱',
  items: [
    { id: 'bird', emoji: '🐦', label: 'yes', f: [1, 1, 0, 1, 0, 0, 0] },
    { id: 'dog', emoji: '🐶', label: 'no', f: [0, 0, 1, 1, 0, 0, 0] },
    { id: 'butterfly', emoji: '🦋', label: 'yes', f: [1, 0, 0, 1, 0, 0, 0] },
    { id: 'bat', emoji: '🦇', label: 'yes', f: [1, 0, 1, 1, 0, 0, 0], tricky: true },
    { id: 'plane', emoji: '✈️', label: 'yes', f: [1, 0, 0, 0, 1, 1, 0] },
    { id: 'fish', emoji: '🐟', label: 'no', f: [0, 0, 0, 0, 0, 0, 1] },
    { id: 'penguin', emoji: '🐧', label: 'no', f: [0.5, 1, 0, 1, 0, 0.3, 1], tricky: true },
    { id: 'elephant', emoji: '🐘', label: 'no', f: [0, 0, 0, 1, 0, 1, 0] },
    { id: 'rocket', emoji: '🚀', label: 'yes', f: [0, 0, 0, 0, 1, 1, 0] },
    { id: 'snail', emoji: '🐌', label: 'no', f: [0, 0, 0, 0, 0, 0, 0] },
    { id: 'bee', emoji: '🐝', label: 'yes', f: [1, 0, 0.5, 1, 0, 0, 0] },
    { id: 'cat', emoji: '🐱', label: 'no', f: [0, 0, 1, 1, 0, 0, 0] },
    { id: 'helicopter', emoji: '🚁', label: 'yes', f: [0, 0, 0, 0, 1, 1, 0] },
  ],
  rounds: [
    { teach: ['bird', 'dog'], test: ['butterfly', 'bat'] },
    { teach: ['plane', 'fish'], test: ['penguin', 'elephant'] },
    { teach: ['rocket', 'snail'], test: ['bee', 'cat', 'helicopter'] },
  ],
};

export const THEMES: readonly Theme[] = [fruit, animal, fly];

/** A new theme unlocks each time Level 1 is completed. */
export const themeForPlay = (plays: number): Theme => THEMES[plays % THEMES.length]!;

export function itemById(theme: Theme, id: string): Item {
  const item = theme.items.find((i) => i.id === id);
  if (!item) throw new Error(`Unknown item ${id} in ${theme.id}`);
  return item;
}

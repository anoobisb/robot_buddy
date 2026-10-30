import type { StringKey } from '../../core/i18n';

export interface Choice {
  icon: string;
  label: StringKey;
  correct: boolean;
}

export interface Scenario {
  id: string;
  /** Cartoon scene: what is on Bolt's screen, plus an optional speech bubble. */
  screen: string[];
  bubble?: string;
  /** Silhouette only, never a realistic stranger. */
  someone?: boolean;
  question: StringKey;
  choices: Choice[];
  rule: StringKey;
}

/** The one picture children learn here: a grown-up with a child means "ask a grown-up". */
export const GROWN_UP = '👩‍👧';

export const SCENARIOS: readonly Scenario[] = [
  {
    id: 'prize',
    screen: ['🎁', '🏆'],
    bubble: '🏠❓',
    question: 'l3.s1.q',
    choices: [
      { icon: '✍️🏠', label: 'l3.s1.bad', correct: false },
      { icon: GROWN_UP, label: 'l3.s1.good', correct: true },
    ],
    rule: 'l3.rule',
  },
  {
    id: 'stranger',
    screen: ['🎮'],
    someone: true,
    bubble: '❓🏫',
    question: 'l3.s2.q',
    choices: [
      { icon: GROWN_UP, label: 'l3.s2.good', correct: true },
      { icon: '🗣️🏫', label: 'l3.s2.bad', correct: false },
    ],
    rule: 'l3.rule',
  },
  {
    id: 'photo',
    screen: ['📷'],
    someone: true,
    bubble: '🙂❓',
    question: 'l3.s3.q',
    choices: [
      { icon: '📸', label: 'l3.s3.bad', correct: false },
      { icon: `✋${GROWN_UP}`, label: 'l3.s3.good', correct: true },
    ],
    rule: 'l3.rule',
  },
  {
    id: 'confusing',
    screen: ['🌀', '❓', '〰️'],
    question: 'l3.s4.q',
    choices: [
      { icon: `❎${GROWN_UP}`, label: 'l3.s4.good', correct: true },
      { icon: '👀', label: 'l3.s4.bad', correct: false },
    ],
    rule: 'l3.rule',
  },
  {
    id: 'password',
    screen: ['🔑', '✱✱✱'],
    someone: true,
    bubble: '🔑❓',
    question: 'l3.s5.q',
    choices: [
      { icon: '🤫🔑', label: 'l3.s5.good', correct: true },
      { icon: '🗣️🔑', label: 'l3.s5.bad', correct: false },
    ],
    rule: 'l3.rule5',
  },
];

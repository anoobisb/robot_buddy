import type { StringKey } from '../../core/i18n';

// Coloring pages: simple robot line art. Every element marked `region` can be
// filled by a tap or a finger swipe; `line` elements are outlines only.
// All drawn for this project (viewBox 0 0 300 300).

export interface Page {
  id: string;
  name: StringKey;
  svg: string;
}

/** Marks a shape as a fillable region with an id. */
const R = (id: string, shape: string) =>
  shape.replace(/^<(\w+)/, `<$1 class="region" data-r="${id}"`);

const bolt = [
  '<line class="line" x1="150" y1="50" x2="150" y2="30"/>',
  R('antenna', '<circle cx="150" cy="24" r="15"/>'),
  R('earL', '<circle cx="56" cy="110" r="15"/>'),
  R('earR', '<circle cx="244" cy="110" r="15"/>'),
  R('head', '<rect x="60" y="50" width="180" height="120" rx="50"/>'),
  R('screen', '<rect x="84" y="72" width="132" height="80" rx="30"/>'),
  R('eyeL', '<circle cx="122" cy="105" r="16"/>'),
  R('eyeR', '<circle cx="178" cy="105" r="16"/>'),
  '<path class="line" d="M128 134 Q150 148 172 134"/>',
  R('armL', '<rect x="48" y="192" width="50" height="20" rx="10"/>'),
  R('armR', '<rect x="202" y="192" width="50" height="20" rx="10"/>'),
  R('body', '<rect x="95" y="176" width="110" height="84" rx="26"/>'),
  R('zap', '<path d="M156 188 L132 222 H150 L142 250 L170 212 H152 Z"/>'),
  R('footL', '<rect x="100" y="258" width="42" height="24" rx="11"/>'),
  R('footR', '<rect x="158" y="258" width="42" height="24" rx="11"/>'),
];

const dog = [
  R('tail', '<path d="M74 150 L30 112 L42 100 L84 138 Z"/>'),
  R('legA', '<rect x="86" y="200" width="24" height="56" rx="10"/>'),
  R('legB', '<rect x="122" y="200" width="24" height="56" rx="10"/>'),
  R('legC', '<rect x="168" y="200" width="24" height="56" rx="10"/>'),
  R('legD', '<rect x="200" y="200" width="24" height="56" rx="10"/>'),
  R('body', '<rect x="70" y="128" width="160" height="84" rx="30"/>'),
  R('spot', '<circle cx="122" cy="168" r="20"/>'),
  R('ear', '<path d="M196 76 L214 34 L236 76 Z"/>'),
  R('head', '<rect x="180" y="70" width="96" height="80" rx="26"/>'),
  R('eye', '<circle cx="236" cy="102" r="11"/>'),
  R('nose', '<circle cx="268" cy="124" r="9"/>'),
  R('collar', '<rect x="176" y="140" width="48" height="14" rx="7"/>'),
  R('bolt', '<circle cx="200" cy="162" r="9"/>'),
];

const idea = [
  '<line class="line" x1="150" y1="6" x2="150" y2="16"/>',
  '<line class="line" x1="104" y1="22" x2="112" y2="30"/>',
  '<line class="line" x1="196" y1="22" x2="188" y2="30"/>',
  R('bulb', '<circle cx="150" cy="56" r="32"/>'),
  R('bulbBase', '<rect x="134" y="84" width="32" height="16" rx="5"/>'),
  R('head', '<rect x="82" y="104" width="136" height="84" rx="18"/>'),
  R('eyeL', '<rect x="108" y="128" width="28" height="22" rx="7"/>'),
  R('eyeR', '<rect x="164" y="128" width="28" height="22" rx="7"/>'),
  R('mouth', '<rect x="118" y="164" width="64" height="12" rx="6"/>'),
  R('armL', '<rect x="52" y="204" width="44" height="18" rx="9"/>'),
  R('armR', '<rect x="204" y="204" width="44" height="18" rx="9"/>'),
  R('body', '<rect x="94" y="194" width="112" height="70" rx="14"/>'),
  R(
    'heart',
    '<path d="M150 252 C118 230 126 206 142 212 C146 213 149 217 150 220 C151 217 154 213 158 212 C174 206 182 230 150 252 Z"/>',
  ),
  R('wheelL', '<circle cx="118" cy="278" r="17"/>'),
  R('wheelR', '<circle cx="182" cy="278" r="17"/>'),
];

const svg = (parts: string[]) =>
  `<svg viewBox="0 0 300 300" xmlns="http://www.w3.org/2000/svg">${parts.join('')}</svg>`;

export const PAGES: readonly Page[] = [
  { id: 'bolt', name: 'l4.page.bolt', svg: svg(bolt) },
  { id: 'dog', name: 'l4.page.dog', svg: svg(dog) },
  { id: 'idea', name: 'l4.page.idea', svg: svg(idea) },
];

export interface Swatch {
  id: 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink' | 'eraser';
  color: string;
}

export const BLANK = '#ffffff';

export const SWATCHES: readonly Swatch[] = [
  { id: 'red', color: '#e63946' },
  { id: 'orange', color: '#f4a261' },
  { id: 'yellow', color: '#ffd60a' },
  { id: 'green', color: '#52b788' },
  { id: 'blue', color: '#4895ef' },
  { id: 'purple', color: '#9b5de5' },
  { id: 'pink', color: '#ff8fab' },
  { id: 'eraser', color: BLANK },
];

/**
 * Bolt's "finish it for me": colors every blank region using the child's own
 * colors, most-used first, in the order the child used them. Pure.
 */
export function suggestFills(
  used: readonly string[],
  blanks: readonly string[],
): Record<string, string> {
  const counts = new Map<string, number>();
  for (const c of used) if (c !== BLANK) counts.set(c, (counts.get(c) ?? 0) + 1);
  // Map keeps first-use order, so ties go to the color picked first.
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([c]) => c);
  const out: Record<string, string> = {};
  if (!ranked.length) return out;
  // A bag where each color appears as often as the child used it.
  const bag = ranked.flatMap((c) => Array.from({ length: counts.get(c)! }, () => c));
  blanks.forEach((id, i) => (out[id] = bag[i % bag.length]!));
  return out;
}

import type { Screen } from '../app';
import { narrate, sfx } from '../core/audio';
import { t, type StringKey } from '../core/i18n';
import { getProgress, type LevelId } from '../core/progress';
import { createBolt } from './bolt';
import { h } from './dom';
import { createShell } from './shell';
import { STICKER_ICON } from './sticker';

const LEVELS: { id: LevelId; icon: string; label: StringKey; say: StringKey }[] = [
  { id: 'teach', icon: '🍎', label: 'hub.teach', say: 'hub.teach.say' },
  { id: 'program', icon: '🔋', label: 'hub.program', say: 'hub.program.say' },
  { id: 'safety', icon: '🛡️', label: 'hub.safety', say: 'hub.safety.say' },
  { id: 'color', icon: '🖍️', label: 'hub.color', say: 'hub.color.say' },
];

export const hubScreen: Screen = (root, app, scope) => {
  const shell = createShell(root, app, scope, 'hub', { home: false, gear: true });
  const bolt = createBolt('hub-bolt');
  scope.add(bolt.dispose);
  const progress = getProgress();

  const levels = h('div', { class: 'hub-levels' });
  const buttons = LEVELS.map((lvl, i) => {
    const n = progress.stickers[lvl.id];
    const stars = h(
      'span',
      { class: 'hub-stars', 'aria-hidden': 'true' },
      n > 0 ? `${STICKER_ICON[lvl.id]}×${n}` : '',
    );
    const btn = h(
      'button',
      {
        class: `btn hub-level hub-level-${lvl.id}`,
        type: 'button',
        'aria-label': `${t(lvl.label)}. ${t('hub.stickers', { n })}`,
        'data-level': lvl.id,
      },
      h('span', { class: 'hub-num', 'aria-hidden': 'true' }, String(i + 1)),
      h('span', { class: 'btn-icon', 'aria-hidden': 'true' }, lvl.icon),
      h('span', { class: 'btn-label', 'aria-hidden': 'true' }, t(lvl.label)),
      stars,
    );
    scope.on(btn, 'click', () => {
      sfx('tap');
      app.go({ name: lvl.id });
    });
    levels.append(btn);
    return btn;
  });

  shell.el.append(h('div', { class: 'hub-hero' }, bolt.el, shell.caption), levels);
  // Bolt introduces each game while pointing at its button, so no reading is needed.
  scope.wait(400, () =>
    narrate([
      { text: t('hub.intro') },
      ...LEVELS.map((lvl, i) => ({ text: t(lvl.say), point: buttons[i] })),
    ]),
  );
  scope.wait(500, () => bolt.flash('happy'));
};

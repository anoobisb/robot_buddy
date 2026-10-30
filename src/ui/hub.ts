import type { Screen } from '../app';
import { say, sfx } from '../core/audio';
import { t } from '../core/i18n';
import { getProgress, type LevelId } from '../core/progress';
import { createBolt } from './bolt';
import { h } from './dom';
import { createShell } from './shell';
import { STICKER_ICON } from './sticker';

const LEVELS: { id: LevelId; icon: string; label: 'hub.teach' | 'hub.program' | 'hub.safety' }[] = [
  { id: 'teach', icon: '🍎', label: 'hub.teach' },
  { id: 'program', icon: '🔋', label: 'hub.program' },
  { id: 'safety', icon: '🛡️', label: 'hub.safety' },
];

export const hubScreen: Screen = (root, app, scope) => {
  const shell = createShell(root, app, scope, 'hub', { home: false, gear: true });
  const bolt = createBolt('hub-bolt');
  scope.add(bolt.dispose);
  const progress = getProgress();

  const levels = h('div', { class: 'hub-levels' });
  LEVELS.forEach((lvl, i) => {
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
  });

  shell.el.append(h('div', { class: 'hub-hero' }, bolt.el, shell.caption), levels);
  scope.wait(400, () => say(t('hub.intro'), true));
  scope.wait(500, () => bolt.flash('happy'));
};

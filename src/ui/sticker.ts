import type { Route, Screen } from '../app';
import { say, sfx } from '../core/audio';
import { t } from '../core/i18n';
import type { LevelId } from '../core/progress';
import { createBolt } from './bolt';
import { h, iconButton } from './dom';
import { createShell } from './shell';

export const STICKER_ICON: Record<LevelId, string> = {
  teach: '🧠',
  program: '🔋',
  safety: '🛡️',
};

export function stickerScreen(level: LevelId, again: Route, next: Route): Screen {
  return (root, app, scope) => {
    const shell = createShell(root, app, scope, 'sticker');
    const bolt = createBolt('sticker-bolt');
    scope.add(bolt.dispose);
    bolt.set('happy');
    const badge = h(
      'div',
      { class: 'sticker-badge', role: 'img', 'aria-label': t('sticker.got') },
      h('span', { 'aria-hidden': 'true' }, STICKER_ICON[level]),
    );
    const againBtn = iconButton('🔁', t('sticker.again'), 'sticker-again', true);
    const nextBtn = iconButton(
      next.name === 'hub' ? '🏠' : '➡️',
      next.name === 'hub' ? t('sticker.home') : t('sticker.next'),
      'sticker-next',
      true,
    );
    scope.on(againBtn, 'click', () => {
      sfx('tap');
      app.go(again);
    });
    scope.on(nextBtn, 'click', () => {
      sfx('tap');
      app.go(next);
    });
    shell.el.append(
      h('div', { class: 'sticker-hero' }, badge, bolt.el),
      shell.caption,
      h('div', { class: 'sticker-actions' }, againBtn, nextBtn),
    );
    sfx('sticker');
    say(t('sticker.got'), true);
  };
}

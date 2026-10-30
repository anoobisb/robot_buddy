import type { Screen } from '../app';
import { unlock } from '../core/audio';
import { t } from '../core/i18n';
import { createBolt } from './bolt';
import { h } from './dom';

export const startScreen: Screen = (root, app, scope) => {
  const bolt = createBolt('start-bolt');
  const go = h(
    'button',
    { class: 'btn start-btn', type: 'button', 'aria-label': t('start.tap') },
    h('span', { class: 'btn-icon', 'aria-hidden': 'true' }, '▶️'),
    h('span', { class: 'btn-label' }, t('start.tap')),
  );
  const el = h('main', { class: 'screen start' }, bolt.el, go);
  root.replaceChildren(el);
  scope.add(bolt.dispose);
  scope.on(go, 'click', () => {
    // Inside the gesture: iOS unlocks Web Audio and speech only here.
    unlock();
    app.go({ name: 'hub' });
  });
  go.focus();
};

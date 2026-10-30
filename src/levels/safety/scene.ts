import type { Screen } from '../../app';
import { say, sfx } from '../../core/audio';
import { t } from '../../core/i18n';
import { updateProgress } from '../../core/progress';
import { createBolt } from '../../ui/bolt';
import { h } from '../../ui/dom';
import { createShell } from '../../ui/shell';
import { SCENARIOS } from './scenarios';

export const safetyScreen: Screen = (root, app, scope) => {
  const shell = createShell(root, app, scope, 'safety');
  const bolt = createBolt('safety-bolt');
  scope.add(bolt.dispose);
  let index = 0;
  let locked = false;

  const picture = h('div', { class: 'scene-picture', 'aria-hidden': 'true' });
  const choices = h('div', { class: 'choices' });
  const dots = h('div', { class: 'puzzle-dots', 'aria-hidden': 'true' });
  shell.el.append(
    h('div', { class: 'safety-stage' }, h('div', { class: 'safety-bolt-wrap' }, bolt.el), picture),
    h('div', { class: 'safety-side' }, shell.caption, choices, dots),
  );

  function show(): void {
    const s = SCENARIOS[index]!;
    locked = false;
    bolt.set('thinking');
    picture.replaceChildren(
      h(
        'div',
        { class: 'tablet' },
        h('div', { class: 'tablet-screen' }, ...s.screen.map((icon) => h('span', {}, icon))),
        s.someone ? h('span', { class: 'someone' }, '👤') : null,
        s.bubble ? h('span', { class: 'bubble' }, s.bubble) : null,
      ),
    );
    choices.replaceChildren(
      ...s.choices.map((c) => {
        const b = h(
          'button',
          { class: 'btn choice', type: 'button', 'aria-label': t(c.label) },
          h('span', { class: 'btn-icon', 'aria-hidden': 'true' }, c.icon),
          h('span', { class: 'btn-label', 'aria-hidden': 'true' }, t(c.label)),
        );
        if (c.correct) b.dataset.correct = 'true';
        scope.on(b, 'click', () => choose(b, c.correct));
        return b;
      }),
    );
    dots.replaceChildren(
      ...SCENARIOS.map((_, i) =>
        h('span', { class: `dot${i < index ? ' is-done' : ''}${i === index ? ' is-now' : ''}` }),
      ),
    );
    say(t(s.question), true);
  }

  function choose(btn: HTMLElement, correct: boolean): void {
    if (locked) return;
    const s = SCENARIOS[index]!;
    if (!correct) {
      sfx('oops');
      bolt.flash('oops', 1500);
      btn.classList.remove('wobble');
      void btn.offsetWidth;
      btn.classList.add('wobble');
      say(`${t('l3.again')} ${t(s.question)}`, true);
      return;
    }
    locked = true;
    sfx('win');
    btn.classList.add('is-right');
    bolt.set('happy');
    say(`${t('l3.yay')} ${t(s.rule)}`);
    scope.wait(3400, () => {
      index++;
      if (index < SCENARIOS.length) {
        show();
        return;
      }
      updateProgress((p) => {
        p.stickers.safety++;
      });
      say(t('l3.recap'), true);
      scope.wait(2600, () =>
        app.go({
          name: 'sticker',
          level: 'safety',
          again: { name: 'safety' },
          next: { name: 'hub' },
        }),
      );
    });
  }

  say(t('l3.intro'), true);
  scope.wait(2800, show);
};

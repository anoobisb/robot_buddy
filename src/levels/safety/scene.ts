import type { Screen } from '../../app';
import { narrate, say, sfx, type Line } from '../../core/audio';
import { t } from '../../core/i18n';
import { updateProgress } from '../../core/progress';
import { createBolt } from '../../ui/bolt';
import { h } from '../../ui/dom';
import { createShell } from '../../ui/shell';
import { GROWN_UP, SCENARIOS } from './scenarios';

export const safetyScreen: Screen = (root, app, scope) => {
  const shell = createShell(root, app, scope, 'safety');
  const bolt = createBolt('safety-bolt');
  scope.add(bolt.dispose);
  let index = 0;
  let locked = false;
  let started = false;
  let choiceEls: HTMLElement[] = [];

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
    choiceEls = s.choices.map((c) => {
      const b = h(
        'button',
        { class: 'btn choice', type: 'button', 'aria-label': t(c.label) },
        h('span', { class: 'btn-icon', 'aria-hidden': 'true' }, c.icon),
        h('span', { class: 'btn-label', 'aria-hidden': 'true' }, t(c.label)),
      );
      if (c.correct) b.dataset.correct = 'true';
      scope.on(b, 'click', () => choose(b, c.correct));
      return b;
    });
    choices.replaceChildren(...choiceEls);
    dots.replaceChildren(
      ...SCENARIOS.map((_, i) =>
        h('span', { class: `dot${i < index ? ' is-done' : ''}${i === index ? ' is-now' : ''}` }),
      ),
    );
    narrate(question());
  }

  /** The situation, then each answer read out while Bolt points at it. */
  function question(): Line[] {
    const s = SCENARIOS[index]!;
    return [
      { text: t(s.question), point: picture.firstElementChild },
      { text: t('l3.whatDo') },
      ...s.choices.map((c, i) => ({
        text: `${i > 0 ? `${t('l3.or')} ` : ''}${t(c.label)}?`,
        point: choiceEls[i],
      })),
    ];
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
      narrate([{ text: t('l3.again') }, ...question().slice(1)]);
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

  // First, teach the one picture that matters: this means "a grown-up".
  const sign = h('div', { class: 'grownup-sign', 'aria-hidden': 'true' }, GROWN_UP);
  picture.replaceChildren(sign);
  const begin = () => {
    if (started) return;
    started = true;
    show();
  };
  narrate(
    [
      { text: t('l3.intro') },
      { text: t('l3.grownupSign'), point: sign },
      { text: t('l3.grownupWho'), point: sign },
    ],
    true,
    () => scope.wait(600, begin),
  );
  // Safety net in case the intro is interrupted (e.g. by the replay button).
  scope.wait(20000, begin);
};

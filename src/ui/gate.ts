import type { Screen } from '../app';
import { sfx } from '../core/audio';
import { t } from '../core/i18n';
import { h, iconButton } from './dom';

const HOLD_MS = 3000;

/** A sum a pre-reader can't guess: two numbers from 6 to 9. */
export function makeQuestion(rand: () => number = Math.random): { a: number; b: number } {
  const pick = () => 6 + Math.floor(rand() * 4);
  return { a: pick(), b: pick() };
}

export const gateScreen: Screen = (root, app, scope) => {
  const close = iconButton('✖️', t('gate.close'), 'gate-close');
  scope.on(close, 'click', () => app.go({ name: 'hub' }));

  const ring = h('span', { class: 'gate-ring', 'aria-hidden': 'true' });
  const hold = h(
    'button',
    { class: 'btn gate-hold', type: 'button', 'aria-label': t('gate.hold') },
    ring,
    h('span', { class: 'btn-icon', 'aria-hidden': 'true' }, '✋'),
  );
  const holdPanel = h(
    'div',
    { class: 'gate-panel' },
    hold,
    h('p', { class: 'gate-text' }, t('gate.hold')),
  );
  const el = h('main', { class: 'screen gate' }, close, holdPanel);
  root.replaceChildren(el);

  let started = 0;
  let raf = 0;
  const stop = () => {
    cancelAnimationFrame(raf);
    started = 0;
    ring.style.setProperty('--p', '0');
  };
  const tick = () => {
    const p = Math.min(1, (performance.now() - started) / HOLD_MS);
    ring.style.setProperty('--p', String(p));
    if (p >= 1) {
      stop();
      sfx('chime');
      showQuestion();
      return;
    }
    raf = requestAnimationFrame(tick);
  };
  const begin = (e: Event) => {
    e.preventDefault();
    if (started) return;
    started = performance.now();
    raf = requestAnimationFrame(tick);
  };
  scope.on(hold, 'pointerdown', begin);
  scope.on(hold, 'pointerup', stop);
  scope.on(hold, 'pointerleave', stop);
  scope.on(hold, 'pointercancel', stop);
  scope.on(hold, 'contextmenu', (e) => e.preventDefault());
  // Keyboard: hold Space or Enter.
  scope.on(hold, 'keydown', (e) => {
    if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) begin(e);
  });
  scope.on(hold, 'keyup', stop);
  scope.add(() => cancelAnimationFrame(raf));

  function showQuestion(): void {
    let q = makeQuestion();
    let entry = '';
    const prompt = h('p', { class: 'gate-question' });
    const display = h('output', { class: 'gate-display', 'aria-live': 'polite' });
    const paint = () => {
      prompt.textContent = t('gate.question', q);
      display.textContent = entry || ' ';
    };
    const pad = h('div', { class: 'gate-pad' });
    for (const d of ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok']) {
      const label = d === 'del' ? t('gate.del') : d === 'ok' ? t('gate.ok') : d;
      const key = h(
        'button',
        { class: `btn gate-key gate-key-${d}`, type: 'button', 'aria-label': label },
        d === 'del' ? '⌫' : label,
      );
      scope.on(key, 'click', () => {
        sfx('tap');
        if (d === 'del') entry = entry.slice(0, -1);
        else if (d === 'ok') {
          if (Number(entry) === q.a + q.b) {
            app.go({ name: 'corner' });
            return;
          }
          entry = '';
          q = makeQuestion();
          prompt.classList.remove('shake');
          void prompt.offsetWidth;
          prompt.classList.add('shake');
          prompt.textContent = t('gate.question', q);
          display.textContent = t('gate.wrong');
          return;
        } else if (entry.length < 2) entry += d;
        paint();
      });
      pad.append(key);
    }
    paint();
    holdPanel.replaceWith(h('div', { class: 'gate-panel gate-math' }, prompt, display, pad));
    pad.querySelector('button')?.focus();
  }
};

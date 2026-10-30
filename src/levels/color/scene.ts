import type { Screen } from '../../app';
import { narrate, say, sfx } from '../../core/audio';
import { t } from '../../core/i18n';
import { getProgress, updateProgress } from '../../core/progress';
import { h, iconButton } from '../../ui/dom';
import { createShell } from '../../ui/shell';
import { BLANK, PAGES, SWATCHES, suggestFills, type Swatch } from './pages';

const MAGIC_STEP_MS = 140;

export function colorScreen(startAt?: number): Screen {
  return (root, app, scope) => {
    const shell = createShell(root, app, scope, 'color');
    let index = (startAt ?? getProgress().colorPage) % PAGES.length;
    let current: Swatch = SWATCHES[0]!;
    let used: string[] = [];
    let regions: SVGElement[] = [];
    let done = false;
    let busy = false;

    // ---- palette ---------------------------------------------------------------
    const palette = h('div', { class: 'swatches' });
    const swatchEls = SWATCHES.map((sw) => {
      const b = h(
        'button',
        {
          class: `btn swatch swatch-${sw.id}`,
          type: 'button',
          'aria-label': t(`l4.${sw.id}`),
          'data-swatch': sw.id,
          style: `--swatch: ${sw.color}`,
        },
        h('span', { class: 'swatch-mark', 'aria-hidden': 'true' }, sw.id === 'eraser' ? '🧽' : ''),
      );
      scope.on(b, 'click', () => {
        current = sw;
        paintSwatches();
        sfx('pick');
        say(t(`l4.${sw.id}`));
      });
      return b;
    });
    const paintSwatches = () =>
      swatchEls.forEach((b, i) => {
        const on = SWATCHES[i] === current;
        b.classList.toggle('is-on', on);
        b.setAttribute('aria-pressed', String(on));
      });

    const magic = iconButton('✨', t('l4.magicLabel'), 'color-magic');
    const next = iconButton('➡️', t('l4.next'), 'color-next');
    palette.append(...swatchEls, magic, next);
    paintSwatches();

    // ---- page --------------------------------------------------------------------
    const page = h('div', { class: 'color-page' });
    shell.el.append(h('div', { class: 'color-stage' }, page), shell.caption, palette);

    const fillOf = (r: SVGElement) => r.getAttribute('fill') ?? BLANK;

    function paint(r: SVGElement, color: string, byChild = true): void {
      if (fillOf(r) === color) return;
      r.setAttribute('fill', color);
      r.classList.remove('just-filled');
      void r.getBoundingClientRect();
      r.classList.add('just-filled');
      if (byChild) {
        sfx('tap');
        used.push(color);
      }
      if (!done && regions.every((x) => fillOf(x) !== BLANK)) finish();
    }

    function load(): void {
      const p = PAGES[index]!;
      done = false;
      busy = false;
      used = [];
      page.innerHTML = p.svg;
      const svgEl = page.querySelector('svg')!;
      svgEl.setAttribute('role', 'group');
      svgEl.setAttribute('aria-label', t(p.name));
      regions = [...svgEl.querySelectorAll<SVGElement>('.region')];
      regions.forEach((r, i) => {
        r.setAttribute('fill', BLANK);
        r.setAttribute('tabindex', '0');
        r.setAttribute('role', 'button');
        r.setAttribute('aria-label', t('l4.part', { n: i + 1 }));
      });
      page.dataset.page = p.id;
    }

    // Finger painting: tap a part, or slide across several parts.
    let painting: number | null = null;
    const regionAt = (x: number, y: number) => {
      const el = document.elementFromPoint(x, y);
      return el instanceof SVGElement && el.classList.contains('region') && page.contains(el)
        ? el
        : null;
    };
    scope.on(page, 'pointerdown', (e) => {
      if (busy) return;
      // A new touch always takes over, so a lost pointerup can never block painting.
      painting = e.pointerId;
      try {
        page.setPointerCapture(e.pointerId);
      } catch {
        // synthetic events
      }
      const r = regionAt(e.clientX, e.clientY);
      if (r) paint(r, current.color);
    });
    scope.on(page, 'pointermove', (e) => {
      if (painting !== e.pointerId || busy) return;
      e.preventDefault();
      const r = regionAt(e.clientX, e.clientY);
      if (r) paint(r, current.color);
    });
    const stop = (e: PointerEvent) => {
      if (painting === e.pointerId) painting = null;
    };
    scope.on(page, 'pointerup', stop);
    scope.on(page, 'pointercancel', stop);
    // Keyboard: Enter or Space on a focused part.
    scope.on(page, 'keydown', (e) => {
      const r = e.target;
      if ((e.key === 'Enter' || e.key === ' ') && r instanceof SVGElement && !busy) {
        e.preventDefault();
        paint(r, current.color);
      }
    });

    // Bolt finishes the picture with the colors the child used most.
    scope.on(magic, 'click', () => {
      if (busy || done) return;
      const blanks = regions.filter((r) => fillOf(r) === BLANK);
      const plan = suggestFills(
        used,
        blanks.map((r) => r.dataset.r!),
      );
      if (!Object.keys(plan).length) {
        sfx('oops');
        narrate([{ text: t('l4.magicNeed'), point: palette }]);
        return;
      }
      busy = true;
      sfx('chime');
      say(t('l4.magicGo'));
      blanks.forEach((r, i) =>
        scope.wait(MAGIC_STEP_MS * (i + 1) + 800, () => {
          paint(r, plan[r.dataset.r!]!, false);
          sfx('step');
        }),
      );
      scope.wait(MAGIC_STEP_MS * (blanks.length + 1) + 800, () => (busy = false));
    });

    scope.on(next, 'click', () => {
      if (busy) return;
      sfx('tap');
      index = (index + 1) % PAGES.length;
      updateProgress((p) => {
        p.colorPage = index;
      });
      load();
    });

    function finish(): void {
      done = true;
      busy = true;
      sfx('win');
      say(t('l4.done'), true);
      const after = (index + 1) % PAGES.length;
      updateProgress((p) => {
        p.stickers.color++;
        p.colorPage = after;
      });
      scope.wait(3200, () =>
        app.go({
          name: 'sticker',
          level: 'color',
          again: { name: 'color', page: index },
          next: { name: 'color', page: after },
        }),
      );
    }

    load();
    narrate([
      { text: t('l4.intro') },
      { text: t('l4.pick'), point: swatchEls[0] },
      { text: t('l4.tap'), point: page },
      { text: t('l4.magic'), point: magic },
    ]);
  };
}

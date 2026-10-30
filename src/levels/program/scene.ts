import type { Screen } from '../../app';
import { say, sfx } from '../../core/audio';
import { createDnd } from '../../core/drag';
import { t } from '../../core/i18n';
import { getProgress, updateProgress } from '../../core/progress';
import { createBolt } from '../../ui/bolt';
import { h, iconButton } from '../../ui/dom';
import { createShell } from '../../ui/shell';
import { expand, run, type Cmd, type Dir, type Pos } from './interpreter';
import { MAX_SLOTS, PUZZLES, STICKER_AFTER } from './puzzles';

const ARROW: Record<Cmd, string> = {
  up: '⬆️',
  down: '⬇️',
  left: '⬅️',
  right: '➡️',
  repeat: '🔁',
};
const DIRS: Dir[] = ['up', 'down', 'left', 'right'];
const TILES: Cmd[] = [...DIRS, 'repeat'];
const STEP_MS = 520;

export function programScreen(startAt?: number): Screen {
  return (root, app, scope) => {
    const shell = createShell(root, app, scope, 'program');
    let index = (startAt ?? getProgress().programPuzzle) % PUZZLES.length;
    let slots: (Cmd | null)[] = [];
    let slotCount = MAX_SLOTS;
    let running = false;

    // ---- board ------------------------------------------------------------------
    const board = h('div', { class: 'board', role: 'img' });
    const bolt = createBolt('token');
    scope.add(bolt.dispose);
    const place = (p: Pos) => {
      bolt.el.style.setProperty('--x', String(p.x));
      bolt.el.style.setProperty('--y', String(p.y));
    };

    // ---- program row ---------------------------------------------------------------
    const row = h('div', { class: 'program-row' });
    const slotEls: HTMLButtonElement[] = [];
    for (let i = 0; i < MAX_SLOTS; i++) {
      const slot = h('button', { class: 'btn slot', type: 'button', 'data-slot': i });
      slotEls.push(slot);
      row.append(slot);
      scope.on(slot, 'click', () => {
        if (running || dnd.justDragged() || !slots[i]) return;
        sfx('pick');
        slots[i] = null;
        clearMarks();
        paintSlots();
      });
    }

    const paintSlots = () => {
      slotEls.forEach((el, i) => {
        const d = slots[i];
        el.textContent = d ? ARROW[d] : '';
        el.classList.toggle('is-filled', !!d);
        el.setAttribute(
          'aria-label',
          d ? `${t('l2.slot', { n: i + 1 })}: ${t(`l2.${d}`)}` : t('l2.slotEmpty', { n: i + 1 }),
        );
        el.hidden = i >= slotCount;
        el.setAttribute('aria-hidden', String(i >= slotCount));
      });
    };
    const clearMarks = () =>
      slotEls.forEach((el) => el.classList.remove('is-active', 'is-bug', 'is-done'));

    const addStep = (d: Cmd, at?: number) => {
      if (running) return;
      const i = at ?? slots.findIndex((s, n) => s === null && n < slotCount);
      if (i < 0 || i >= slotCount) {
        sfx('oops');
        say(t('l2.full'));
        return;
      }
      sfx('tap');
      slots[i] = d;
      clearMarks();
      paintSlots();
      const el = slotEls[i]!;
      el.scrollIntoView?.({ block: 'nearest', inline: 'nearest' });
      el.classList.remove('pop');
      void el.offsetWidth;
      el.classList.add('pop');
    };

    // ---- palette (tap to add, or drag onto a slot) ------------------------------
    const dnd = createDnd({
      tapSelect: false,
      onPick: () => sfx('pick'),
      onDrop: (id, zone) => addStep(id as Cmd, Number(zone)),
    });
    scope.add(dnd.destroy);
    slotEls.forEach((el, i) => dnd.addZone(el, String(i)));

    const palette = h('div', { class: 'palette' });
    const tiles = new Map<Cmd, HTMLButtonElement>();
    for (const d of TILES) {
      const b = iconButton(ARROW[d], t(`l2.${d}`), `arrow arrow-${d}`);
      tiles.set(d, b);
      b.dataset.dir = d;
      dnd.addItem(b, d);
      scope.on(b, 'click', () => {
        if (!dnd.justDragged()) addStep(d);
      });
      palette.append(b);
    }

    const runBtn = iconButton('▶️', t('l2.run'), 'run-btn');
    const clearBtn = iconButton('🧹', t('l2.clear'), 'clear-btn');
    scope.on(clearBtn, 'click', () => {
      if (running) return;
      sfx('tap');
      slots = slots.map(() => null);
      clearMarks();
      paintSlots();
    });
    scope.on(runBtn, 'click', go);

    const dots = h('div', { class: 'puzzle-dots', 'aria-hidden': 'true' });
    shell.el.append(
      h('div', { class: 'program-board' }, board, dots),
      h(
        'div',
        { class: 'program-controls' },
        shell.caption,
        palette,
        row,
        h('div', { class: 'program-actions' }, clearBtn, runBtn),
      ),
    );

    // ---- puzzle setup ----------------------------------------------------------------
    function load(): void {
      const p = PUZZLES[index]!;
      running = false;
      board.style.setProperty('--n', String(p.size));
      const cells: HTMLElement[] = [];
      for (let y = 0; y < p.size; y++) {
        for (let x = 0; x < p.size; x++) {
          const wall = p.walls.some((w) => w.x === x && w.y === y);
          const goal = p.goal.x === x && p.goal.y === y;
          cells.push(
            h(
              'div',
              {
                class: `cell${wall ? ' cell-wall' : ''}${goal ? ' cell-goal' : ''}`,
                'aria-hidden': 'true',
              },
              wall ? '🪨' : goal ? '🔋' : '',
            ),
          );
        }
      }
      board.replaceChildren(...cells, bolt.el);
      const offered = new Set<Cmd>(p.palette ?? DIRS);
      if (p.repeat) offered.add('repeat');
      tiles.forEach((b, d) => (b.hidden = !offered.has(d)));
      slotCount = p.slots ?? MAX_SLOTS;
      board.setAttribute('aria-label', `${index + 1} / ${PUZZLES.length}`);
      bolt.set('idle');
      place(p.start);
      slots = Array.from({ length: MAX_SLOTS }, (_, i) => p.program?.[i] ?? null);
      clearMarks();
      paintSlots();
      dots.replaceChildren(
        ...PUZZLES.map((_, i) =>
          h('span', { class: `dot${i < index ? ' is-done' : ''}${i === index ? ' is-now' : ''}` }),
        ),
      );
    }

    function go(): void {
      if (running) return;
      const p = PUZZLES[index]!;
      // Empty slots are skipped; map[k] is the slot of the k-th tile.
      const map: number[] = [];
      const cmds: Cmd[] = [];
      slots.forEach((d, i) => {
        if (d && i < slotCount) {
          map.push(i);
          cmds.push(d);
        }
      });
      const { steps: program, from } = expand(cmds);
      const slotOf = from.map((k) => map[k]!);
      if (!program.length) {
        sfx('oops');
        say(t('l2.empty'), true);
        return;
      }
      running = true;
      sfx('tap');
      clearMarks();
      place(p.start);
      bolt.set('idle');
      say(t('l2.go'));
      const r = run(p, program);
      const moves = r.states.slice(1);
      moves.forEach((pos, i) => {
        scope.wait(STEP_MS * (i + 1), () => {
          slotEls.forEach((el) => el.classList.remove('is-active'));
          slotEls[slotOf[i]!]!.classList.add('is-active', 'is-done');
          sfx('step');
          place(pos);
        });
      });
      scope.wait(STEP_MS * (moves.length + 1), () => finish(r.result, r.failedStep, slotOf, map));
    }

    function finish(result: string, failed: number | null, slotOf: number[], map: number[]): void {
      slotEls.forEach((el) => el.classList.remove('is-active'));
      if (result === 'reached_goal') {
        sfx('win');
        bolt.set('happy');
        say(t('l2.done'));
        const done = index;
        const next = (index + 1) % PUZZLES.length;
        updateProgress((pr) => {
          pr.programPuzzle = next;
          if (STICKER_AFTER.has(done)) pr.stickers.program++;
        });
        scope.wait(2200, () => {
          if (STICKER_AFTER.has(done)) {
            app.go({
              name: 'sticker',
              level: 'program',
              again: { name: 'program', puzzle: 0 },
              next: next === 0 ? { name: 'safety' } : { name: 'program', puzzle: next },
            });
            return;
          }
          index = next;
          load();
          say(introFor(index, t('l2.next')), true);
        });
        return;
      }
      // A bug: show where, gently, then let the child fix it.
      sfx(result === 'hit_wall' ? 'bump' : 'oops');
      bolt.set('oops');
      const bugSlot =
        result === 'hit_wall'
          ? slotOf[failed ?? 0]
          : slots.findIndex((s, i) => s === null && i < slotCount && i > (map.at(-1) ?? -1));
      if (bugSlot !== undefined && bugSlot >= 0) slotEls[bugSlot]?.classList.add('is-bug');
      say(result === 'hit_wall' ? t('l2.bug') : t('l2.more'), true);
      scope.wait(1800, () => {
        bolt.set('idle');
        place(PUZZLES[index]!.start);
        running = false;
      });
    }

    function introFor(i: number, fallback: string): string {
      const p = PUZZLES[i]!;
      if (p.kind === 'fix') return t('l2.fixIntro');
      return p.repeat ? t('l2.repeatIntro') : fallback;
    }

    load();
    say(introFor(index, t('l2.intro')), true);
  };
}

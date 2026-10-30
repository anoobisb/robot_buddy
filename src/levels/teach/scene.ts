import type { Screen } from '../../app';
import { say, sfx } from '../../core/audio';
import { createDnd } from '../../core/drag';
import { t } from '../../core/i18n';
import { getProgress, updateProgress } from '../../core/progress';
import { createBolt } from '../../ui/bolt';
import { h, iconButton } from '../../ui/dom';
import { createShell } from '../../ui/shell';
import type { Example, Label } from './classifier';
import { itemById, themeForPlay, type Item } from './items';
import { guessFor, toExample } from './session';

const BRAIN_BULBS = 8;

export const teachScreen: Screen = (root, app, scope) => {
  const theme = themeForPlay(getProgress().teachPlays);
  const shell = createShell(root, app, scope, `teach theme-${theme.id}`);
  const bolt = createBolt('teach-bolt');
  scope.add(bolt.dispose);

  const labelText = (l: Label) => t(l === 'yes' ? `l1.${theme.id}.yes` : `l1.${theme.id}.no`);
  const examples: Example[] = [];
  let round = 0;
  let testIndex = 0;

  // ---- layout ----------------------------------------------------------------
  const makeBin = (label: Label) => {
    const items = h('span', { class: 'bin-items', 'aria-hidden': 'true' });
    const el = h(
      'button',
      {
        class: `btn bin bin-${label}`,
        type: 'button',
        'aria-label': t('l1.bin', { label: labelText(label) }),
        'data-bin': label,
      },
      h(
        'span',
        { class: 'bin-icon', 'aria-hidden': 'true' },
        label === 'yes' ? theme.yesIcon : theme.noIcon,
      ),
      h('span', { class: 'bin-mark', 'aria-hidden': 'true' }, label === 'yes' ? '✔' : '✖'),
      items,
    );
    return { el, items };
  };
  const bins = { yes: makeBin('yes'), no: makeBin('no') };

  const bulbs = Array.from({ length: BRAIN_BULBS }, () => h('span', { class: 'bulb' }, '💡'));
  const brain = h('div', { class: 'brain', role: 'img' }, ...bulbs);
  const paintBrain = () => {
    const n = examples.length;
    bulbs.forEach((b, i) => b.classList.toggle('is-lit', i < n));
    brain.setAttribute('aria-label', t('l1.brain', { n }));
  };
  paintBrain();

  const tray = h('div', { class: 'tray' });
  shell.el.append(
    h('div', { class: 'teach-center' }, bolt.el, brain, shell.caption),
    bins.yes.el,
    bins.no.el,
    tray,
  );

  // ---- drag & drop ------------------------------------------------------------
  let phase: 'teach' | 'guess' | 'correct' | 'busy' = 'busy';

  const dnd = createDnd({
    onPick() {
      sfx('pick');
      bolt.set('listening');
    },
    onMove: (x, y) => bolt.lookAt(x, y),
    onCancel() {
      bolt.set('idle');
      bolt.lookReset();
    },
    onDrop: (id, zone) => dropped(id, zone as Label),
  });
  scope.add(dnd.destroy);
  dnd.addZone(bins.yes.el, 'yes');
  dnd.addZone(bins.no.el, 'no');

  const makeCard = (item: Item) => {
    const card = h(
      'button',
      { class: 'btn card', type: 'button', 'data-item': item.id },
      h('span', { class: 'card-emoji' }, item.emoji),
    );
    dnd.addItem(card, item.id);
    return card;
  };

  function dropped(id: string, zone: Label): void {
    if (phase !== 'teach' && phase !== 'correct') return;
    const item = itemById(theme, id);
    const card = tray.querySelector<HTMLElement>(`[data-item="${id}"]`);
    bolt.lookReset();
    if (zone !== item.label) {
      sfx('oops');
      bolt.flash('oops');
      say(t('l1.tryAgain'));
      card?.classList.remove('wobble');
      void card?.offsetWidth;
      card?.classList.add('wobble');
      return;
    }
    sfx('drop');
    if (card) {
      dnd.removeItem(card);
      card.remove();
    }
    bins[zone].items.append(h('span', { class: 'bin-mini' }, item.emoji));
    bins[zone].el.classList.remove('gulp');
    void bins[zone].el.offsetWidth;
    bins[zone].el.classList.add('gulp');
    examples.push(toExample(item));
    paintBrain();
    bolt.flash('happy');

    if (phase === 'teach') {
      say(t('l1.learning'));
      if (!tray.querySelector('.card')) {
        phase = 'busy';
        scope.wait(1600, startGuesses);
      }
    } else {
      phase = 'busy';
      say(t('l1.thanks'));
      scope.wait(2200, nextTest);
    }
  }

  // ---- phases -------------------------------------------------------------------
  function startTeach(): void {
    phase = 'teach';
    const r = theme.rounds[round]!;
    tray.replaceChildren(...r.teach.map((id) => makeCard(itemById(theme, id))));
    tray.className = 'tray';
  }

  function startGuesses(): void {
    testIndex = 0;
    say(t('l1.guessTime'), true);
    scope.wait(2600, showGuess);
  }

  function showGuess(): void {
    phase = 'busy';
    const item = itemById(theme, theme.rounds[round]!.test[testIndex]!);
    const guess = guessFor(examples, item);
    bins.yes.el.classList.remove('is-guess');
    bins.no.el.classList.remove('is-guess');

    const pick = h('span', { class: 'guess-pick', 'aria-hidden': 'true' }, '🤔');
    const yes = iconButton('✅', t('l1.right'), 'answer answer-yes');
    const no = iconButton('❌', t('l1.wrong'), 'answer answer-no');
    yes.disabled = true;
    no.disabled = true;
    const card = h(
      'div',
      { class: 'guess', 'data-guess': item.id },
      h('span', { class: 'card card-static' }, h('span', { class: 'card-emoji' }, item.emoji)),
      pick,
      h('div', { class: 'answers' }, yes, no),
    );
    tray.replaceChildren(card);
    tray.className = 'tray tray-guess';
    bolt.set('thinking');

    scope.wait(1300, () => {
      bolt.set('idle');
      pick.textContent = guess.label === 'yes' ? theme.yesIcon : theme.noIcon;
      pick.dataset.label = guess.label;
      bins[guess.label].el.classList.add('is-guess');
      say(t('l1.guess', { label: labelText(guess.label) }), true);
      yes.disabled = false;
      no.disabled = false;
      phase = 'guess';
    });

    const answer = (childSaysRight: boolean) => {
      if (phase !== 'guess') return;
      sfx('tap');
      const correct = guess.label === item.label;
      if (childSaysRight !== correct) {
        // The child misjudged: no penalty, just look again.
        sfx('oops');
        say(t('l1.lookAgain'), true);
        return;
      }
      phase = 'busy';
      yes.disabled = true;
      no.disabled = true;
      bins[guess.label].el.classList.remove('is-guess');
      if (correct) {
        sfx('win');
        bolt.flash('happy', 1600);
        say(t('l1.yay'));
        scope.wait(2000, nextTest);
        return;
      }
      sfx('oops');
      bolt.flash('oops', 2400);
      const lines = [t('l1.oops')];
      if (examples.length < 6) lines.push(t('l1.fewExamples'));
      lines.push(t('l1.showMe'));
      say(lines.join(' '), true);
      scope.wait(1200, () => {
        tray.replaceChildren(makeCard(item));
        tray.className = 'tray tray-correct';
        phase = 'correct';
      });
    };
    scope.on(yes, 'click', () => answer(true));
    scope.on(no, 'click', () => answer(false));
  }

  function nextTest(): void {
    testIndex++;
    if (testIndex < theme.rounds[round]!.test.length) {
      showGuess();
      return;
    }
    round++;
    if (round < theme.rounds.length) {
      say(t('l1.teachMore'), true);
      startTeach();
      return;
    }
    finish();
  }

  function finish(): void {
    phase = 'busy';
    tray.replaceChildren();
    bolt.set('happy');
    sfx('win');
    say(t('l1.recap'), true);
    updateProgress((p) => {
      p.stickers.teach++;
      p.teachPlays++;
    });
    scope.wait(3800, () =>
      app.go({
        name: 'sticker',
        level: 'teach',
        again: { name: 'teach' },
        next: { name: 'program' },
      }),
    );
  }

  say(t(`l1.${theme.id}.intro`), true);
  startTeach();
};

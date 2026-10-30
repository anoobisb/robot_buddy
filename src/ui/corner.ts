import type { Screen } from '../app';
import {
  availableVoices,
  getVoiceSettings,
  isMuted,
  say,
  setMuted,
  setVoiceSettings,
  sfx,
} from '../core/audio';
import { t, type StringKey } from '../core/i18n';
import { getProgress, resetProgress } from '../core/progress';
import { h } from './dom';

type NoteLevel = 'teach' | 'program' | 'safety' | 'color';

const LEVEL_NOTES: { id: NoteLevel; questions: StringKey[] }[] = [
  {
    id: 'teach',
    questions: ['corner.teach.q1', 'corner.teach.q2', 'corner.teach.q3', 'corner.teach.q4'],
  },
  { id: 'program', questions: ['corner.program.q1', 'corner.program.q2', 'corner.program.q3'] },
  {
    id: 'safety',
    questions: ['corner.safety.q1', 'corner.safety.q2', 'corner.safety.q3', 'corner.safety.q4'],
  },
  { id: 'color', questions: ['corner.color.q1', 'corner.color.q2', 'corner.color.q3'] },
];

const titleKey = (id: NoteLevel) => `corner.${id}.title` as const;
const learnKey = (id: NoteLevel) => `corner.${id}.learn` as const;

const section = (title: string, ...body: (Node | string)[]) =>
  h('section', { class: 'corner-section' }, h('h2', {}, title), ...body);

export const cornerScreen: Screen = (root, app, scope) => {
  // Sound and voice
  const mute = h('input', { type: 'checkbox', id: 'corner-mute' });
  mute.checked = isMuted();
  scope.on(mute, 'change', () => setMuted(mute.checked));
  const test = h('button', { class: 'btn corner-btn', type: 'button' }, `🔊 ${t('corner.test')}`);
  scope.on(test, 'click', () => {
    sfx('chime');
    say(t('corner.testLine'));
  });

  const noVoices = h('p', { class: 'corner-note' }, t('corner.noVoices'));
  const voice = h('select', { id: 'corner-voice' });
  const fillVoices = () => {
    const current = getVoiceSettings().voiceURI;
    voice.replaceChildren(h('option', { value: '' }, t('corner.voiceAuto')));
    for (const v of availableVoices()) {
      const opt = h('option', { value: v.voiceURI }, `${v.name} (${v.lang})`);
      if (v.voiceURI === current) opt.selected = true;
      voice.append(opt);
    }
    noVoices.hidden = voice.options.length > 1;
  };
  scope.on(voice, 'change', () => {
    setVoiceSettings({ voiceURI: voice.value });
    say(t('corner.testLine'));
  });
  try {
    if (typeof speechSynthesis !== 'undefined') {
      speechSynthesis.addEventListener('voiceschanged', fillVoices);
      scope.add(() => speechSynthesis.removeEventListener('voiceschanged', fillVoices));
    }
  } catch {
    // no speech on this device
  }

  const rate = h('input', { type: 'range', id: 'corner-rate', min: 0.6, max: 1.2, step: 0.05 });
  rate.value = String(getVoiceSettings().rate);
  scope.on(rate, 'change', () => {
    setVoiceSettings({ rate: Number(rate.value) });
    say(t('corner.testLine'));
  });

  // Progress
  const p = getProgress();
  const progressLine = h(
    'p',
    {},
    t('corner.progressLine', {
      a: p.stickers.teach,
      b: p.stickers.program,
      c: p.stickers.safety,
      d: p.stickers.color,
    }),
  );
  const reset = h(
    'button',
    { class: 'btn corner-btn corner-reset', type: 'button' },
    t('corner.reset'),
  );
  let armed = false;
  scope.on(reset, 'click', () => {
    if (!armed) {
      armed = true;
      reset.textContent = t('corner.resetConfirm');
      return;
    }
    resetProgress();
    armed = false;
    reset.textContent = t('corner.reset');
    progressLine.textContent = t('corner.resetDone');
  });

  const done = h(
    'button',
    { class: 'btn corner-btn corner-done', type: 'button' },
    `🏠 ${t('corner.done')}`,
  );
  scope.on(done, 'click', () => app.go({ name: 'hub' }));

  const talk = LEVEL_NOTES.map((lvl) =>
    h(
      'div',
      { class: 'corner-level' },
      h('h3', {}, t(titleKey(lvl.id))),
      h('ul', {}, ...lvl.questions.map((q) => h('li', {}, t(q)))),
    ),
  );
  const learning = LEVEL_NOTES.map((lvl) =>
    h('p', {}, h('strong', {}, `${t(titleKey(lvl.id))}: `), t(learnKey(lvl.id))),
  );

  const el = h(
    'main',
    { class: 'screen corner' },
    h(
      'div',
      { class: 'corner-scroll' },
      h('header', { class: 'corner-head' }, h('h1', {}, t('corner.title')), done),
      section(
        t('corner.sound'),
        h('label', { class: 'corner-row', for: 'corner-mute' }, mute, t('corner.mute')),
        test,
        h('p', { class: 'corner-note' }, t('corner.noSound')),
        h(
          'label',
          { class: 'corner-row corner-col', for: 'corner-voice' },
          t('corner.voice'),
          voice,
        ),
        noVoices,
        h('label', { class: 'corner-row corner-col', for: 'corner-rate' }, t('corner.rate'), rate),
      ),
      section(t('corner.progress'), progressLine, reset),
      section(t('corner.talk'), ...talk),
      section(t('corner.learning'), ...learning),
      section(t('corner.install'), h('p', {}, t('corner.installText'))),
      section(t('corner.privacy'), h('p', {}, t('corner.privacyText'))),
      section(t('corner.credits'), h('p', {}, t('corner.creditsText'))),
    ),
  );
  root.replaceChildren(el);
  fillVoices();
  done.focus();
};

import type { App } from '../app';
import { isMuted, onCaption, onMute, replay, setMuted, sfx } from '../core/audio';
import { t } from '../core/i18n';
import type { Scope } from '../core/scope';
import { h, iconButton } from './dom';

export interface ShellOptions {
  home?: boolean;
  gear?: boolean;
}

export interface Shell {
  el: HTMLElement;
  bar: HTMLElement;
  caption: HTMLElement;
}

/**
 * The frame every screen shares: home, replay-instruction and mute buttons,
 * plus a caption bubble that mirrors whatever Bolt says (the no-voice fallback).
 */
export function createShell(
  root: HTMLElement,
  app: App,
  scope: Scope,
  cls: string,
  opts: ShellOptions = {},
): Shell {
  const bar = h('nav', { class: 'bar', 'aria-label': t('app.title') });
  if (opts.home !== false) {
    const home = iconButton('🏠', t('ui.home'), 'bar-btn bar-home');
    scope.on(home, 'click', () => {
      sfx('tap');
      app.go({ name: 'hub' });
    });
    bar.append(home);
  }
  const again = iconButton('🔊', t('ui.replay'), 'bar-btn bar-replay');
  scope.on(again, 'click', () => {
    sfx('tap');
    replay();
  });
  const mute = iconButton('', '', 'bar-btn bar-mute');
  const paintMute = (m: boolean) => {
    mute.querySelector('.btn-icon')!.textContent = m ? '🔇' : '🔈';
    mute.setAttribute('aria-label', m ? t('ui.unmute') : t('ui.mute'));
    mute.setAttribute('aria-pressed', String(m));
  };
  paintMute(isMuted());
  scope.add(onMute(paintMute));
  scope.on(mute, 'click', () => {
    setMuted(!isMuted());
    sfx('tap');
  });
  bar.append(again, mute);
  if (opts.gear) {
    const gear = iconButton('⚙️', t('ui.grownups'), 'bar-btn bar-gear');
    scope.on(gear, 'click', () => app.go({ name: 'gate' }));
    bar.append(gear);
  }

  const caption = h('p', { class: 'caption', 'aria-live': 'polite' });
  scope.add(
    onCaption((text) => {
      caption.textContent = text;
      caption.classList.remove('pop');
      void caption.offsetWidth;
      caption.classList.add('pop');
    }),
  );

  const el = h('main', { class: `screen ${cls}` }, bar);
  root.replaceChildren(el);
  return { el, bar, caption };
}

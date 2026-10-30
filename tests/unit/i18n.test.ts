import { describe, expect, it } from 'vitest';
import { format, lookup, resolveLang } from '../../src/core/i18n';
import { pickVoice } from '../../src/core/audio';
import { ar } from '../../src/strings/ar';
import { en, type StringKey } from '../../src/strings/en';

const placeholders = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();

describe('i18n', () => {
  it('reads ?lang= and falls back to English', () => {
    expect(resolveLang('?lang=ar')).toBe('ar');
    expect(resolveLang('?lang=AR')).toBe('ar');
    expect(resolveLang('?lang=xx')).toBe('en');
    expect(resolveLang('')).toBe('en');
  });

  it('fills placeholders and leaves unknown ones alone', () => {
    expect(format('{a} + {b}', { a: 7, b: 5 })).toBe('7 + 5');
    expect(format('{a} + {c}', { a: 1 })).toBe('1 + {c}');
  });

  it('falls back to English for a missing key', () => {
    expect(lookup('xx', 'ui.home')).toBe(en['ui.home']);
  });

  it('translates every English key into Arabic with the same placeholders', () => {
    for (const key of Object.keys(en) as StringKey[]) {
      expect(ar[key], key).toBeTruthy();
      expect(placeholders(ar[key]!), key).toEqual(placeholders(en[key]));
    }
  });
});

describe('voice picking', () => {
  const v = (name: string, lang: string, localService = true) => ({
    name,
    lang,
    voiceURI: name,
    localService,
  });
  const voices = [
    v('Daniel', 'en-GB'),
    v('Samantha', 'en-US'),
    v('Random', 'en-US', false),
    v('Maged', 'ar-SA'),
  ];

  it('prefers a friendly voice in the exact language', () => {
    expect(pickVoice(voices, 'en-US')?.name).toBe('Samantha');
  });

  it('honours the grown-up choice', () => {
    expect(pickVoice(voices, 'en-US', 'Daniel')?.name).toBe('Daniel');
  });

  it('matches by base language and returns null when nothing fits', () => {
    expect(pickVoice(voices, 'ar')?.name).toBe('Maged');
    expect(pickVoice(voices, 'fr-FR')).toBeNull();
  });
});

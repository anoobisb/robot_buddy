import { en, type StringKey } from '../strings/en';
import { ar } from '../strings/ar';

export type { StringKey };
export type Table = Partial<Record<StringKey, string>>;
export type Vars = Record<string, string | number>;

const tables: Record<string, Table> = { en, ar };
const RTL = new Set(['ar']);
const SPEECH_LANG: Record<string, string> = { en: 'en-US', ar: 'ar' };

let current = 'en';

/** Picks the language from `?lang=xx`, falling back to English. */
export function resolveLang(search: string): string {
  const q = new URLSearchParams(search).get('lang')?.toLowerCase() ?? '';
  return q in tables ? q : 'en';
}

export function format(template: string, vars?: Vars): string {
  if (!vars) return template;
  return template.replace(/\{(\w+)\}/g, (m, name: string) =>
    name in vars ? String(vars[name]) : m,
  );
}

export function lookup(lang: string, key: StringKey, vars?: Vars): string {
  return format(tables[lang]?.[key] ?? en[key], vars);
}

export function setLang(lang: string): void {
  current = lang in tables ? lang : 'en';
  if (typeof document !== 'undefined') {
    document.documentElement.lang = current;
    document.documentElement.dir = RTL.has(current) ? 'rtl' : 'ltr';
  }
}

export const lang = (): string => current;
export const speechLang = (): string => SPEECH_LANG[current] ?? 'en-US';
export const t = (key: StringKey, vars?: Vars): string => lookup(current, key, vars);

// Safe localStorage wrapper: every access is guarded, and an in-memory copy is
// used whenever storage is missing, blocked or full.
const PREFIX = 'robot-buddy:';
const memory = new Map<string, string>();
let cached: Storage | null | undefined;

function storage(): Storage | null {
  if (cached !== undefined) return cached;
  try {
    const s = globalThis.localStorage;
    s.setItem(`${PREFIX}probe`, '1');
    s.removeItem(`${PREFIX}probe`);
    cached = s;
  } catch {
    cached = null;
  }
  return cached;
}

export function load<T>(key: string, fallback: T): T {
  let raw: string | null;
  try {
    raw = storage()?.getItem(PREFIX + key) ?? null;
  } catch {
    raw = null;
  }
  raw ??= memory.get(key) ?? null;
  if (raw === null) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  const raw = JSON.stringify(value);
  memory.set(key, raw);
  try {
    storage()?.setItem(PREFIX + key, raw);
  } catch {
    // Quota or privacy mode: the in-memory copy still works for this session.
  }
}

export function remove(key: string): void {
  memory.delete(key);
  try {
    storage()?.removeItem(PREFIX + key);
  } catch {
    // ignore
  }
}

/** Test hook: forget the cached storage handle. */
export function _resetForTests(): void {
  cached = undefined;
  memory.clear();
}

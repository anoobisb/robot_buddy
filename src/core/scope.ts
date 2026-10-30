// Tracks timers and listeners for one screen so leaving it cleans everything up.
// `?fast` shortens every delay; the Playwright tests use it.
const speed = typeof location !== 'undefined' && /[?&]fast\b/.test(location.search) ? 0.05 : 1;

export interface Scope {
  wait(ms: number, fn: () => void): void;
  on<K extends keyof HTMLElementEventMap>(
    el: EventTarget,
    type: K,
    fn: (e: HTMLElementEventMap[K]) => void,
  ): void;
  add(dispose: () => void): void;
  dispose(): void;
}

export function createScope(): Scope {
  const disposers: (() => void)[] = [];
  return {
    wait(ms, fn) {
      const id = setTimeout(fn, ms * speed);
      disposers.push(() => clearTimeout(id));
    },
    on(el, type, fn) {
      const h = fn as EventListener;
      el.addEventListener(type, h);
      disposers.push(() => el.removeEventListener(type, h));
    },
    add(d) {
      disposers.push(d);
    },
    dispose() {
      while (disposers.length) disposers.pop()?.();
    },
  };
}

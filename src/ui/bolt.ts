// Bolt, the mascot: one inline SVG whose look is driven by CSS state classes.
export type BoltState = 'idle' | 'listening' | 'thinking' | 'happy' | 'oops';

export interface Bolt {
  el: HTMLElement;
  set(state: BoltState): void;
  /** Shows a state briefly, then returns to idle. */
  flash(state: BoltState, ms?: number): void;
  /** Points the pupils toward a screen position. */
  lookAt(x: number, y: number): void;
  lookReset(): void;
  dispose(): void;
}

const SVG = `
<svg viewBox="0 0 200 230" aria-hidden="true" focusable="false">
  <g class="bolt-body">
    <line x1="100" y1="40" x2="100" y2="14" stroke="#33415c" stroke-width="6" stroke-linecap="round"/>
    <circle class="bolt-bulb" cx="100" cy="12" r="10"/>
    <rect x="58" y="150" width="84" height="62" rx="24" fill="#ffb703"/>
    <path d="M104 160 L90 184 H102 L96 204 L112 178 H100 Z" fill="#fff8e1"/>
    <rect class="bolt-arm bolt-arm-l" x="32" y="160" width="26" height="14" rx="7" fill="#ffb703"/>
    <rect class="bolt-arm bolt-arm-r" x="142" y="160" width="26" height="14" rx="7" fill="#ffb703"/>
    <g class="bolt-head">
      <rect x="22" y="40" width="156" height="112" rx="46" fill="#4cc9f0"/>
      <rect x="40" y="56" width="120" height="80" rx="34" fill="#1d3557"/>
      <circle cx="30" cy="96" r="10" fill="#4cc9f0" stroke="#3aa6c8" stroke-width="3"/>
      <circle cx="170" cy="96" r="10" fill="#4cc9f0" stroke="#3aa6c8" stroke-width="3"/>
      <g class="bolt-eyes">
        <circle cx="74" cy="90" r="16" fill="#e0fbfc"/>
        <circle cx="126" cy="90" r="16" fill="#e0fbfc"/>
        <g class="bolt-pupils">
          <circle cx="74" cy="90" r="7" fill="#1d3557"/>
          <circle cx="126" cy="90" r="7" fill="#1d3557"/>
        </g>
      </g>
      <circle cx="56" cy="118" r="7" fill="#ff8fab" opacity=".8"/>
      <circle cx="144" cy="118" r="7" fill="#ff8fab" opacity=".8"/>
      <path class="bolt-mouth bolt-mouth-smile" d="M84 116 Q100 128 116 116" stroke="#e0fbfc" stroke-width="5" fill="none" stroke-linecap="round"/>
      <path class="bolt-mouth bolt-mouth-grin" d="M80 112 Q100 136 120 112 Z" fill="#e0fbfc"/>
      <ellipse class="bolt-mouth bolt-mouth-o" cx="100" cy="120" rx="8" ry="7" fill="#e0fbfc"/>
      <path class="bolt-mouth bolt-mouth-hmm" d="M88 120 H112" stroke="#e0fbfc" stroke-width="5" stroke-linecap="round"/>
    </g>
  </g>
</svg>`;

export function createBolt(extraClass = ''): Bolt {
  const el = document.createElement('div');
  el.className = `bolt ${extraClass}`.trim();
  el.innerHTML = SVG;
  const pupils = el.querySelector<SVGGElement>('.bolt-pupils');
  let state: BoltState = 'idle';
  let timer: ReturnType<typeof setTimeout> | undefined;

  const set = (s: BoltState) => {
    clearTimeout(timer);
    el.classList.remove(`is-${state}`);
    state = s;
    el.classList.add(`is-${state}`);
    el.dataset.state = s;
  };
  set('idle');

  return {
    el,
    set,
    flash(s, ms = 1400) {
      set(s);
      timer = setTimeout(() => set('idle'), ms);
    },
    lookAt(x, y) {
      if (!pupils) return;
      const r = el.getBoundingClientRect();
      const dx = x - (r.left + r.width / 2);
      const dy = y - (r.top + r.height * 0.4);
      const len = Math.hypot(dx, dy) || 1;
      pupils.style.transform = `translate(${(dx / len) * 6}px, ${(dy / len) * 5}px)`;
    },
    lookReset() {
      if (pupils) pupils.style.transform = '';
    },
    dispose() {
      clearTimeout(timer);
    },
  };
}

// Pointer-event drag and drop with a tap fallback: tap an item to pick it up,
// then tap a zone to drop it. Keyboard works the same way via click events.
// No HTML5 drag-and-drop API (unreliable on touch).

export interface DndOptions {
  onDrop(itemId: string, zoneId: string): void;
  onPick?(itemId: string): void;
  onSelect?(itemId: string | null): void;
  /** Pointer position while dragging, e.g. so Bolt's eyes can follow. */
  onMove?(x: number, y: number): void;
  onCancel?(itemId: string): void;
  /** Tap-to-pick-up fallback. Off when a tap on the item means something else. */
  tapSelect?: boolean;
}

export interface Dnd {
  addItem(el: HTMLElement, id: string): void;
  addZone(el: HTMLElement, id: string): void;
  removeItem(el: HTMLElement): void;
  select(id: string | null): void;
  selected(): string | null;
  /** True while the click that follows a finished drag is being swallowed. */
  justDragged(): boolean;
  destroy(): void;
}

const THRESHOLD = 10;

export function createDnd(opts: DndOptions): Dnd {
  const items = new Map<HTMLElement, string>();
  const zones = new Map<HTMLElement, string>();
  const cleanups: (() => void)[] = [];
  let selectedId: string | null = null;
  let suppressClick = false;

  const zoneAt = (x: number, y: number): HTMLElement | null => {
    for (const el of zones.keys()) {
      const r = el.getBoundingClientRect();
      if (x >= r.left && x <= r.right && y >= r.top && y <= r.bottom) return el;
    }
    return null;
  };

  const markSelected = () => {
    for (const [el, id] of items) {
      el.classList.toggle('is-selected', id === selectedId);
      if (opts.tapSelect !== false) el.setAttribute('aria-pressed', String(id === selectedId));
    }
    for (const el of zones.keys()) el.classList.toggle('is-armed', selectedId !== null);
  };

  const select = (id: string | null) => {
    selectedId = id;
    markSelected();
    opts.onSelect?.(id);
  };

  const listen = (el: HTMLElement, type: string, fn: EventListener) => {
    el.addEventListener(type, fn);
    cleanups.push(() => el.removeEventListener(type, fn));
  };

  function addItem(el: HTMLElement, id: string): void {
    items.set(el, id);
    el.classList.add('draggable');
    if (opts.tapSelect !== false) el.setAttribute('aria-pressed', 'false');
    let pointerId: number | null = null;
    let startX = 0;
    let startY = 0;
    let dragging = false;
    let hover: HTMLElement | null = null;

    const setHover = (z: HTMLElement | null) => {
      if (z === hover) return;
      hover?.classList.remove('is-hover');
      hover = z;
      hover?.classList.add('is-hover');
    };

    const end = (e: PointerEvent, cancelled: boolean) => {
      if (pointerId !== e.pointerId) return;
      pointerId = null;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        // already released
      }
      if (!dragging) return;
      dragging = false;
      suppressClick = true;
      setTimeout(() => (suppressClick = false), 0);
      el.classList.remove('is-dragging');
      el.style.transform = '';
      const zone = cancelled ? null : zoneAt(e.clientX, e.clientY);
      setHover(null);
      const zoneId = zone ? zones.get(zone) : undefined;
      if (zoneId !== undefined) {
        selectedId = null;
        markSelected();
        opts.onDrop(id, zoneId);
      } else {
        opts.onCancel?.(id);
      }
    };

    listen(el, 'pointerdown', ((e: PointerEvent) => {
      if (pointerId !== null || (e.pointerType === 'mouse' && e.button !== 0)) return;
      if (!items.has(el)) return;
      pointerId = e.pointerId;
      startX = e.clientX;
      startY = e.clientY;
      try {
        el.setPointerCapture(e.pointerId);
      } catch {
        // synthetic events in tests
      }
    }) as EventListener);

    listen(el, 'pointermove', ((e: PointerEvent) => {
      if (pointerId !== e.pointerId) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      if (!dragging && Math.hypot(dx, dy) > THRESHOLD) {
        dragging = true;
        el.classList.add('is-dragging');
        opts.onPick?.(id);
      }
      if (!dragging) return;
      e.preventDefault();
      el.style.transform = `translate(${dx}px, ${dy}px) scale(1.08)`;
      setHover(zoneAt(e.clientX, e.clientY));
      opts.onMove?.(e.clientX, e.clientY);
    }) as EventListener);

    listen(el, 'pointerup', ((e: PointerEvent) => end(e, false)) as EventListener);
    listen(el, 'pointercancel', ((e: PointerEvent) => end(e, true)) as EventListener);

    listen(el, 'click', () => {
      if (suppressClick || !items.has(el) || opts.tapSelect === false) return;
      select(selectedId === id ? null : id);
      if (selectedId) opts.onPick?.(id);
    });
  }

  function addZone(el: HTMLElement, id: string): void {
    zones.set(el, id);
    el.classList.add('dropzone');
    listen(el, 'click', () => {
      if (suppressClick || selectedId === null) return;
      const item = selectedId;
      select(null);
      opts.onDrop(item, id);
    });
  }

  return {
    addItem,
    addZone,
    removeItem(el) {
      if (items.get(el) === selectedId) select(null);
      items.delete(el);
      el.classList.remove('draggable', 'is-selected', 'is-dragging');
    },
    select,
    selected: () => selectedId,
    justDragged: () => suppressClick,
    destroy() {
      cleanups.forEach((fn) => fn());
      items.clear();
      zones.clear();
    },
  };
}

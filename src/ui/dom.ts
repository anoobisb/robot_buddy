type Attrs = Record<string, string | number | boolean | undefined>;

export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs: Attrs = {},
  ...children: (Node | string | null | undefined | false)[]
): HTMLElementTagNameMap[K] {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v === undefined || v === false) continue;
    if (k === 'class') el.className = String(v);
    else el.setAttribute(k, v === true ? '' : String(v));
  }
  for (const c of children) {
    if (c === null || c === undefined || c === false) continue;
    el.append(c);
  }
  return el;
}

/** A big button showing an icon, with the label as accessible name (and optional caption). */
export function iconButton(
  icon: string,
  label: string,
  cls = '',
  showLabel = false,
): HTMLButtonElement {
  return h(
    'button',
    { class: `btn ${cls}`.trim(), type: 'button', 'aria-label': label },
    h('span', { class: 'btn-icon', 'aria-hidden': 'true' }, icon),
    showLabel ? h('span', { class: 'btn-label', 'aria-hidden': 'true' }, label) : null,
  );
}

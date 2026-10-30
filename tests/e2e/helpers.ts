import { expect, type Page, type TestInfo } from '@playwright/test';

/** Collects console errors and page errors; assert none at the end of a test. */
export function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on('console', (m) => {
    if (m.type() === 'error') errors.push(m.text());
  });
  page.on('pageerror', (e) => errors.push(e.message));
  return errors;
}

export const isTablet = (page: Page) => {
  const v = page.viewportSize()!;
  return Math.min(v.width, v.height) >= 600;
};

export const isTouch = (info: TestInfo) => info.project.name !== 'desktop';

/** Tap on touch projects, click on desktop. */
export async function press(page: Page, selector: string, info: TestInfo): Promise<void> {
  const loc = page.locator(selector).first();
  if (isTouch(info)) await loc.tap();
  else await loc.click();
}

export async function start(page: Page, info: TestInfo): Promise<void> {
  await page.goto('./?fast');
  await press(page, '.start-btn', info);
  await expect(page.locator('#app')).toHaveAttribute('data-route', 'hub');
}

/**
 * The layout rules from SPEC.md section 3: every interactive element is on screen
 * (or inside the sideways-scrolling step row), meets its minimum size, and no two
 * overlap. The page itself never scrolls.
 */
export async function checkLayout(page: Page): Promise<void> {
  const tablet = isTablet(page);
  const problems = await page.evaluate(
    ({ minTap, minDrag }) => {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const out: string[] = [];
      const els = [...document.querySelectorAll<HTMLElement>('#app button')].filter((el) => {
        const r = el.getBoundingClientRect();
        return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden';
      });
      const items = els.map((el) => ({
        el,
        r: el.getBoundingClientRect(),
        inScroller: !!el.closest('.program-row'),
        name: el.getAttribute('aria-label') || el.textContent?.trim() || el.className,
      }));
      for (const { el, r, inScroller, name } of items) {
        const min = el.classList.contains('card') ? minDrag : minTap;
        if (r.width < min - 0.5 || r.height < min - 0.5) {
          out.push(`too small (${Math.round(r.width)}x${Math.round(r.height)} < ${min}): ${name}`);
        }
        if (inScroller) continue;
        if (r.left < -0.5 || r.top < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5) {
          out.push(`clipped: ${name} at ${Math.round(r.left)},${Math.round(r.top)}`);
        }
      }
      const row = document.querySelector('.program-row');
      if (row) {
        const r = row.getBoundingClientRect();
        if (r.left < -0.5 || r.right > vw + 0.5 || r.bottom > vh + 0.5)
          out.push('step row clipped');
      }
      for (let i = 0; i < items.length; i++) {
        for (let j = i + 1; j < items.length; j++) {
          const a = items[i]!;
          const b = items[j]!;
          if (a.inScroller || b.inScroller) continue;
          const w = Math.min(a.r.right, b.r.right) - Math.max(a.r.left, b.r.left);
          const h = Math.min(a.r.bottom, b.r.bottom) - Math.max(a.r.top, b.r.top);
          if (w > 1 && h > 1) out.push(`overlap: ${a.name} / ${b.name}`);
        }
      }
      const root = document.scrollingElement!;
      if (root.scrollHeight > vh + 1 || root.scrollWidth > vw + 1) out.push('page scrolls');
      return out;
    },
    { minTap: tablet ? 88 : 64, minDrag: tablet ? 110 : 88 },
  );
  expect(problems).toEqual([]);
}

/** Swaps width and height, like turning the device. */
export async function rotate(page: Page): Promise<void> {
  const v = page.viewportSize()!;
  await page.setViewportSize({ width: v.height, height: v.width });
}

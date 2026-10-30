import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { DELTA, run, type Dir } from '../../src/levels/program/interpreter';
import { PUZZLES } from '../../src/levels/program/puzzles';
import { THEMES, itemById } from '../../src/levels/teach/items';
import { solveTiles } from '../shared/solve';
import { checkLayout, isTouch, press, rotate, start, watchErrors } from './helpers';

const route = (page: Page) => page.locator('#app').getAttribute('data-route');

/** Plays Level 1 the way a child would, using taps (or clicks on desktop). */
async function playTeach(
  page: Page,
  info: TestInfo,
  hooks: { afterFirstDrop?: () => Promise<void>; atGuess?: () => Promise<void> } = {},
): Promise<{ wrong: string[] }> {
  const theme = THEMES[0]!;
  const wrong: string[] = [];
  let drops = 0;
  let sawGuess = false;
  for (let i = 0; i < 400; i++) {
    if ((await route(page)) === 'sticker') return { wrong };
    const card = page.locator('.tray .card.draggable');
    if (await card.count()) {
      const id = (await card.first().getAttribute('data-item'))!;
      await press(page, `.card[data-item="${id}"]`, info);
      await press(page, `[data-bin="${itemById(theme, id).label}"]`, info);
      drops++;
      if (drops === 1) await hooks.afterFirstDrop?.();
      continue;
    }
    if (await page.locator('.answer-yes:not([disabled])').count()) {
      if (!sawGuess) {
        sawGuess = true;
        await hooks.atGuess?.();
      }
      const id = (await page.locator('.guess').getAttribute('data-guess'))!;
      const guess = await page.locator('.guess-pick').getAttribute('data-label');
      const right = guess === itemById(theme, id).label;
      if (!right) wrong.push(id);
      await press(page, right ? '.answer-yes' : '.answer-no', info);
      continue;
    }
    await page.waitForTimeout(30);
  }
  throw new Error('Level 1 did not finish');
}

async function waitIdle(page: Page): Promise<void> {
  await expect(page.locator('.token')).toHaveAttribute('data-state', 'idle');
}

/** Solves every Level 2 puzzle, finding and fixing the bug in the "fix" ones. */
async function playProgram(page: Page, info: TestInfo): Promise<void> {
  for (let i = 0; i < PUZZLES.length; i++) {
    const p = PUZZLES[i]!;
    await expect(page.locator('.board')).toHaveAttribute(
      'aria-label',
      `${i + 1} / ${PUZZLES.length}`,
    );
    await waitIdle(page);
    if (p.repeat) await checkLayout(page);
    if (p.kind === 'fix') {
      await press(page, '.run-btn', info);
      const bug = page.locator('.slot.is-bug');
      await expect(bug).toHaveCount(1);
      const at = Number(await bug.getAttribute('data-slot'));
      await waitIdle(page);
      await press(page, `.slot[data-slot="${at}"]`, info);
      await expect(page.locator(`.slot[data-slot="${at}"]`)).not.toHaveClass(/is-filled/);
      const fix = (Object.keys(DELTA) as Dir[]).find((d) => {
        const program = [...p.program!];
        program[at] = d;
        return run(p, program).result === 'reached_goal';
      })!;
      await press(page, `.arrow-${fix}`, info);
    } else {
      await press(page, '.clear-btn', info);
      for (const c of solveTiles(p)!) await press(page, `.arrow-${c}`, info);
    }
    await press(page, '.run-btn', info);
    if (i === 3) {
      await expect(page.locator('#app')).toHaveAttribute('data-route', 'sticker');
      await checkLayout(page);
      await press(page, '.sticker-next', info);
      await expect(page.locator('#app')).toHaveAttribute('data-route', 'program');
    }
  }
  await expect(page.locator('#app')).toHaveAttribute('data-route', 'sticker');
}

async function playSafety(page: Page, info: TestInfo): Promise<void> {
  for (let i = 0; i < 5; i++) {
    await expect(page.locator('.dot').nth(i)).toHaveClass(/is-now/);
    await expect(page.locator('.choice')).toHaveCount(2);
    await press(page, '.choice:not([data-correct])', info);
    // A wrong answer just wobbles and Bolt asks again; no penalty.
    await expect(page.locator('.choice:not([data-correct])')).toHaveClass(/wobble/);
    await press(page, '.choice[data-correct]', info);
    await expect(page.locator('.choice.is-right')).toHaveCount(1);
  }
  await expect(page.locator('#app')).toHaveAttribute('data-route', 'sticker');
}

test.describe('smoke', () => {
  let errors: string[] = [];

  test.beforeEach(({ page }) => {
    errors = watchErrors(page);
  });

  test.afterEach(() => {
    expect(errors, 'console errors').toEqual([]);
  });

  test('start screen and hub fit the screen', async ({ page }, info) => {
    await page.goto('./?fast');
    await checkLayout(page);
    await start(page, info);
    await checkLayout(page);
    await expect(page.locator('.hub-level')).toHaveCount(4);
    // Bolt points at each game while saying what it is.
    await expect(page.locator('.hub-level.is-pointed')).toHaveCount(1);
    await expect(page.locator('a[href]')).toHaveCount(0);
  });

  test('Level 1: teach Bolt through 3 rounds and earn a sticker', async ({ page }, info) => {
    await start(page, info);
    await press(page, '[data-level=teach]', info);
    await checkLayout(page);
    const { wrong } = await playTeach(page, info, { atGuess: () => checkLayout(page) });
    // The designed mistake: Bolt gets a tricky item wrong early on.
    expect(wrong.length).toBeGreaterThan(0);
    expect(wrong).toContain('coconut');
    await checkLayout(page);
    await press(page, '.bar-home', info);
    await expect(page.locator('[data-level=teach]')).toHaveAttribute('aria-label', /1 stickers/);
  });

  test('Level 1: rotating mid-level keeps progress and re-lays out', async ({ page }, info) => {
    await start(page, info);
    await press(page, '[data-level=teach]', info);
    await playTeach(page, info, {
      afterFirstDrop: async () => {
        await expect(page.locator('.brain')).toHaveAttribute('aria-label', /1 examples/);
        await rotate(page);
        await checkLayout(page);
        await expect(page.locator('.brain')).toHaveAttribute('aria-label', /1 examples/);
        await expect(page.locator('.bin-mini')).toHaveCount(1);
        await expect(page.locator('.tray .card')).toHaveCount(1);
      },
    });
    await expect(page.locator('#app')).toHaveAttribute('data-route', 'sticker');
  });

  test('Level 2: program Bolt through all 8 puzzles, fixing bugs', async ({ page }, info) => {
    await start(page, info);
    await press(page, '[data-level=program]', info);
    await checkLayout(page);
    await playProgram(page, info);
    await checkLayout(page);
  });

  test('Level 2: a wrong program shows the bug; rotating keeps the steps', async ({
    page,
  }, info) => {
    await start(page, info);
    await press(page, '[data-level=program]', info);
    await waitIdle(page);
    await press(page, '.arrow-up', info);
    await press(page, '.arrow-up', info);
    await press(page, '.run-btn', info);
    await expect(page.locator('.slot.is-bug')).toHaveAttribute('data-slot', '1');
    await expect(page.locator('.caption')).toContainText('bug');
    await rotate(page);
    await checkLayout(page);
    await expect(page.locator('.slot.is-filled')).toHaveCount(2);
    await waitIdle(page);
    await press(page, '.slot[data-slot="1"]', info);
    await press(page, '.slot[data-slot="0"]', info);
    await press(page, '.arrow-right', info);
    await press(page, '.run-btn', info);
    await expect(page.locator('.board')).toHaveAttribute('aria-label', '2 / 8');
  });

  test('Level 3: five safety scenes and a sticker', async ({ page }, info) => {
    await start(page, info);
    await press(page, '[data-level=safety]', info);
    await expect(page.locator('.choice')).toHaveCount(2);
    await checkLayout(page);
    await rotate(page);
    await checkLayout(page);
    await rotate(page);
    await playSafety(page, info);
  });

  test('Arabic switches to right-to-left and still fits', async ({ page }, info) => {
    await page.goto('./?fast&lang=ar');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');
    await press(page, '.start-btn', info);
    await expect(page.locator('.caption')).not.toBeEmpty();
    await checkLayout(page);
    for (const level of ['teach', 'program', 'safety', 'color']) {
      await press(page, `[data-level=${level}]`, info);
      await expect(page.locator('.caption')).not.toBeEmpty();
      await checkLayout(page);
      await press(page, '.bar-home', info);
    }
  });

  test('Level 4: color with taps, Bolt finishes with your colors, sticker', async ({
    page,
  }, info) => {
    await start(page, info);
    await press(page, '[data-level=color]', info);
    await expect(page.locator('.color-page .region').first()).toBeVisible();
    await checkLayout(page);
    // Bolt can't help before it has seen any examples.
    await press(page, '.color-magic', info);
    await expect(page.locator('.color-page .region[fill="#ffffff"]')).not.toHaveCount(0);
    await press(page, '[data-swatch=blue]', info);
    await expect(page.locator('[data-swatch=blue]')).toHaveAttribute('aria-pressed', 'true');
    await press(page, '[data-r=antenna]', info);
    await expect(page.locator('[data-r=antenna]')).toHaveAttribute('fill', '#4895ef');
    await press(page, '[data-swatch=yellow]', info);
    await press(page, '[data-r=footL]', info);
    await expect(page.locator('[data-r=footL]')).toHaveAttribute('fill', '#ffd60a');
    await rotate(page);
    await checkLayout(page);
    await expect(page.locator('[data-r=antenna]')).toHaveAttribute('fill', '#4895ef');
    await press(page, '.color-magic', info);
    await expect(page.locator('#app')).toHaveAttribute('data-route', 'sticker');
    await checkLayout(page);
    await press(page, '.bar-home', info);
    await expect(page.locator('[data-level=color]')).toHaveAttribute('aria-label', /1 stickers/);
  });

  test('grown-up gate needs a 3 second hold and a sum', async ({ page }, info) => {
    await start(page, info);
    await press(page, '.bar-gear', info);
    await expect(page.locator('#app')).toHaveAttribute('data-route', 'gate');
    const hold = page.locator('.gate-hold');
    // A quick tap does nothing.
    await press(page, '.gate-hold', info);
    await expect(page.locator('.gate-question')).toHaveCount(0);
    await hold.dispatchEvent('pointerdown', { pointerId: 1, isPrimary: true });
    await expect(page.locator('.gate-question')).toBeVisible({ timeout: 6000 });
    const text = (await page.locator('.gate-question').textContent())!;
    const [a, b] = text.match(/\d+/g)!.map(Number);
    for (const digit of String(a! + b!)) await press(page, `.gate-key-${digit}`, info);
    await press(page, '.gate-key-ok', info);
    await expect(page.locator('#app')).toHaveAttribute('data-route', 'corner');
    await expect(page.locator('.corner-section')).toHaveCount(7);
    await expect(page.locator('a[href]')).toHaveCount(0);
  });
});

test.describe('touch drag', () => {
  test('sliding a finger colors every part it crosses', async ({ page, browserName }, info) => {
    test.skip(!isTouch(info) || browserName !== 'chromium', 'needs Chromium touch emulation');
    await start(page, info);
    await press(page, '[data-level=color]', info);
    await press(page, '[data-swatch=green]', info);
    const a = (await page.locator('[data-r=armL]').boundingBox())!;
    const b = (await page.locator('[data-r=armR]').boundingBox())!;
    const y = a.y + a.height / 2;
    const cdp = await page.context().newCDPSession(page);
    const pt = (x: number) => [{ x, y, id: 1, radiusX: 2, radiusY: 2, force: 1 }];
    const x0 = a.x + 4;
    const x1 = b.x + b.width - 4;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: pt(x0) });
    for (let i = 1; i <= 20; i++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: pt(x0 + ((x1 - x0) * i) / 20),
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    for (const r of ['armL', 'body', 'armR']) {
      await expect(page.locator(`[data-r=${r}]`)).toHaveAttribute('fill', '#52b788');
    }
  });

  test('dragging a card with a finger drops it in the bin', async ({ page, browserName }, info) => {
    test.skip(!isTouch(info) || browserName !== 'chromium', 'needs Chromium touch emulation');
    await start(page, info);
    await press(page, '[data-level=teach]', info);
    const card = page.locator('.card[data-item=banana]');
    const bin = page.locator('[data-bin=yes]');
    const from = (await card.boundingBox())!;
    const to = (await bin.boundingBox())!;
    const cdp = await page.context().newCDPSession(page);
    const point = (x: number, y: number) => [{ x, y, id: 1, radiusX: 4, radiusY: 4, force: 1 }];
    const sx = from.x + from.width / 2;
    const sy = from.y + from.height / 2;
    const ex = to.x + to.width / 2;
    const ey = to.y + to.height / 2;
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: point(sx, sy) });
    for (let s = 1; s <= 8; s++) {
      await cdp.send('Input.dispatchTouchEvent', {
        type: 'touchMove',
        touchPoints: point(sx + ((ex - sx) * s) / 8, sy + ((ey - sy) * s) / 8),
      });
    }
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await expect(page.locator('.bin-yes .bin-mini')).toHaveCount(1);
    await expect(page.locator('.brain')).toHaveAttribute('aria-label', /1 examples/);
  });
});

test.describe('desktop', () => {
  test('mouse drag and keyboard both work', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop only');
    await page.goto('./?fast');
    await page.keyboard.press('Enter');
    await expect(page.locator('#app')).toHaveAttribute('data-route', 'hub');
    await page.locator('[data-level=teach]').focus();
    await page.keyboard.press('Space');
    await expect(page.locator('#app')).toHaveAttribute('data-route', 'teach');
    const card = (await page.locator('.card[data-item=rock]').boundingBox())!;
    const bin = (await page.locator('[data-bin=no]').boundingBox())!;
    await page.mouse.move(card.x + card.width / 2, card.y + card.height / 2);
    await page.mouse.down();
    await page.mouse.move(bin.x + bin.width / 2, bin.y + bin.height / 2, { steps: 10 });
    await page.mouse.up();
    await expect(page.locator('.bin-no .bin-mini')).toHaveCount(1);
    // Keyboard: Enter on a card picks it up, Enter on a bin drops it.
    await page.locator('.card[data-item=banana]').focus();
    await page.keyboard.press('Enter');
    await page.locator('[data-bin=yes]').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('.bin-yes .bin-mini')).toHaveCount(1);
  });

  test('works offline after the first load and makes no third-party requests', async ({
    page,
    context,
  }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop only');
    const origins = new Set<string>();
    page.on('request', (r) => origins.add(new URL(r.url()).origin));
    await page.goto('./?fast');
    await page.evaluate(async () => {
      await navigator.serviceWorker.ready;
    });
    // Let the service worker finish precaching, then take it over.
    await page.reload();
    await expect.poll(() => page.evaluate(() => !!navigator.serviceWorker.controller)).toBe(true);
    expect([...origins]).toEqual(['http://localhost:4173']);

    await context.setOffline(true);
    await page.reload();
    await page.locator('.start-btn').click();
    await expect(page.locator('#app')).toHaveAttribute('data-route', 'hub');
    await page.locator('[data-level=program]').click();
    await expect(page.locator('.board')).toBeVisible();
  });

  test('missing localStorage and speechSynthesis do not crash the game', async ({ page }, info) => {
    test.skip(info.project.name !== 'desktop', 'desktop only');
    const errors = watchErrors(page);
    await page.addInitScript(() => {
      Object.defineProperty(window, 'localStorage', {
        get() {
          throw new Error('blocked');
        },
      });
      // @ts-expect-error simulate a browser without speech
      delete window.speechSynthesis;
      Object.defineProperty(window, 'speechSynthesis', { value: undefined });
    });
    await page.goto('./?fast');
    await page.locator('.start-btn').click();
    await page.locator('[data-level=safety]').click();
    await expect(page.locator('.caption')).not.toBeEmpty();
    await expect(page.locator('.choice')).toHaveCount(2);
    expect(errors).toEqual([]);
  });
});

// Dev helper: screenshots each screen at a viewport. Usage:
//   node scripts/shots.mjs <outDir> [width] [height]
// Needs `npx vite preview --port 4173` running.
import { chromium } from '@playwright/test';

const [out = 'shots', w = '390', h = '844'] = process.argv.slice(2);
const width = Number(w);
const height = Number(h);
const base = 'http://localhost:4173/robot_buddy/?fast';

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width, height },
  hasTouch: true,
  isMobile: true,
  deviceScaleFactor: 1,
  reducedMotion: 'reduce',
});
const page = await ctx.newPage();
page.on('console', (m) => m.type() === 'error' && console.log('console error:', m.text()));
page.on('pageerror', (e) => console.log('page error:', e.message));
const shot = (name) => page.screenshot({ path: `${out}/${width}x${height}-${name}.png` });

await page.goto(base);
await shot('start');
await page.locator('.start-btn').tap();
await page.waitForTimeout(300);
await shot('hub');
await page.locator('[data-level=teach]').tap();
await page.waitForTimeout(300);
await shot('teach');
await page.locator('.card').first().tap();
await page.waitForTimeout(100);
await shot('teach-selected');
await page.locator('[data-bin=yes]').tap();
await page.locator('.card[data-item=rock]').tap();
await page.locator('[data-bin=no]').tap();
await page.locator('.answer-yes:not([disabled])').waitFor();
await shot('teach-guess');
await page.locator('.bar-home').tap();
await page.evaluate(
  'localStorage.setItem("robot-buddy:progress", JSON.stringify({programPuzzle: 7}))',
);
await page.locator('[data-level=program]').tap();
await page.waitForTimeout(300);
await page.locator('.arrow-right').tap();
await page.locator('.arrow-down').tap();
await page.locator('.arrow-repeat').tap();
await shot('program');
await page.locator('.bar-home').tap();
await page.locator('[data-level=safety]').tap();
await page.waitForTimeout(600);
await shot('safety');
await page.locator('.bar-home').tap();
await page.locator('.bar-gear').tap();
await shot('gate');
await page.locator('.gate-close').tap();
await page.evaluate('localStorage.clear()');
await browser.close();

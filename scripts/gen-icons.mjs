// Renders public/favicon.svg into the PNG icons the PWA manifest and iOS need.
// Uses Playwright's Chromium (already a dev dependency). Run: node scripts/gen-icons.mjs
import { chromium } from '@playwright/test';
import { readFileSync } from 'node:fs';

const svg = readFileSync('public/favicon.svg', 'utf8');
const targets = [
  { file: 'public/apple-touch-icon.png', size: 180, pad: 0.08 },
  { file: 'public/icon-192.png', size: 192, pad: 0 },
  { file: 'public/icon-512.png', size: 512, pad: 0 },
  // Maskable icons keep the art inside the central 80% safe zone.
  { file: 'public/icon-maskable-512.png', size: 512, pad: 0.14 },
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const { file, size, pad } of targets) {
  await page.setViewportSize({ width: size, height: size });
  const inner = Math.round(size * (1 - pad * 2));
  await page.setContent(
    `<body style="margin:0;background:#fdf6e3;display:grid;place-items:center;height:${size}px">
       <div style="width:${inner}px;height:${inner}px">${svg.replace('<svg ', '<svg width="100%" height="100%" ')}</div>
     </body>`,
  );
  await page.screenshot({ path: file, omitBackground: false });
  console.log('wrote', file);
}
await browser.close();

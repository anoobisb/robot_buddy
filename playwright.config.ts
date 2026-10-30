import { defineConfig, devices } from '@playwright/test';

// The reference viewports from SPEC.md section 3.
export const VIEWPORTS = [
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-portrait', width: 820, height: 1180 },
  { name: 'ipad-pro-landscape', width: 1366, height: 1024 },
  { name: 'android-tablet-portrait', width: 800, height: 1280 },
  { name: 'iphone-portrait', width: 390, height: 844 },
  { name: 'iphone-landscape', width: 844, height: 390 },
  { name: 'small-phone-portrait', width: 360, height: 640 },
  { name: 'small-phone-landscape', width: 640, height: 360 },
];

const PORT = 4173;

export default defineConfig({
  testDir: 'tests/e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? 'github' : 'list',
  use: {
    baseURL: `http://localhost:${PORT}/robot_buddy/`,
    reducedMotion: 'reduce',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}/robot_buddy/`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    ...VIEWPORTS.map((v) => ({
      name: v.name,
      use: {
        ...devices['Desktop Chrome'],
        viewport: { width: v.width, height: v.height },
        hasTouch: true,
        isMobile: true,
        deviceScaleFactor: 2,
      },
    })),
    // Mouse and keyboard on a desktop browser.
    {
      name: 'desktop',
      use: { ...devices['Desktop Chrome'], viewport: { width: 1280, height: 800 } },
    },
  ],
});

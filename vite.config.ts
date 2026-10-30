import { defineConfig } from 'vitest/config';
import { VitePWA } from 'vite-plugin-pwa';

// GitHub Pages serves the site at /<repo>/. In Actions the repo name comes from
// GITHUB_REPOSITORY; locally we default to this repo's name.
const repo = process.env.GITHUB_REPOSITORY?.split('/')[1] ?? 'robot_buddy';
const base = `/${repo}/`;

export default defineConfig({
  base,
  build: { target: 'es2020' },
  plugins: [
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png'],
      manifest: {
        name: 'Robot Buddy',
        short_name: 'Robot Buddy',
        description: 'Teach, program and keep Bolt the robot safe. A playful first look at AI.',
        lang: 'en',
        theme_color: '#2b6cb0',
        background_color: '#fdf6e3',
        display: 'standalone',
        orientation: 'any',
        scope: base,
        start_url: base,
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,webmanifest}'],
        navigateFallback: `${base}index.html`,
      },
    }),
  ],
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
});

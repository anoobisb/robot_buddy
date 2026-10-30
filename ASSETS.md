# Assets

All assets are generated for this project. There are no image, audio or font files from third parties.

| Asset                                            | Source                                                                                         | Licence        |
| ------------------------------------------------ | ---------------------------------------------------------------------------------------------- | -------------- |
| Bolt mascot (`src/ui/bolt.ts`)                   | Original inline SVG, hand-written for this project                                             | Original work  |
| App icons (`public/favicon.svg`, `public/*.png`) | Original SVG; PNGs rendered from it by `scripts/gen-icons.mjs`                                 | Original work  |
| Sound effects (`src/core/audio.ts`)              | Synthesised at runtime with the Web Audio API (oscillators); no audio files                    | Original work  |
| Voice                                            | The device's own `speechSynthesis` voices; nothing is bundled or downloaded                    | Device/OS      |
| Pictures of items, choices and scenes            | Unicode emoji characters, drawn by the device's system emoji font; no emoji images are bundled | Device/OS font |
| Fonts                                            | System rounded font stack (`ui-rounded`, `SF Pro Rounded`, …); no web fonts                    | Device/OS      |

Runtime dependencies: none. Dev dependencies (Vite, TypeScript, vite-plugin-pwa/Workbox, Vitest,
Playwright, ESLint, Prettier) are MIT or Apache-2.0 licensed; Workbox's service worker code is
bundled into the build (MIT).

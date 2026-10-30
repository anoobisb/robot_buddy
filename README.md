# Robot Buddy

A free, private, browser game for pre-readers (about age 5) and a grown-up playing alongside.
The child teaches, programs and protects **Bolt**, a friendly robot, and picks up four ideas:

1. **AI learns from examples** – more examples make it better.
2. **AI makes mistakes** – people help it get better.
3. **Computers follow steps** – order matters, and you can fix a bug.
4. **Be safe online** – don't share personal things; ask a grown-up.

Everything is spoken and shown with pictures, so reading is never needed. There are no accounts,
ads, analytics or network requests after the first load, and it works offline as an installed app.

**Play:** https://robot-buddy-five.vercel.app/

## The games

|     | Game                | What happens                                                                                                                                                                                                                                                                                                                                                                  |
| --- | ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | **Teach Bolt**      | Sort pictures into two boxes. Each one is a labelled example for a real k-nearest-neighbours classifier. Bolt then guesses new pictures; the child taps ✅ or ❌ and shows Bolt where wrong ones go. Bolt gets tricky items (coconut, teddy, bat…) wrong early and everything right by round 3. A new theme (fruit, animals vs toys, things that fly) unlocks on each replay. |
| 2   | **Program Bolt**    | Tap or drag arrows into a row of up to 8 steps, press ▶️ and watch Bolt walk to the battery. If it bumps into something, the step with the bug lights up 🐞; tap it to remove it and pick a new arrow. 8 puzzles on 4×4 and 5×5 boards, including two "fix the broken program" puzzles and a final loop puzzle where the 🔁 tile repeats the steps before it.                 |
| 3   | **Bolt's Safe Net** | Five calm cartoon scenes (a prize pop-up, a stranger in a game, a photo request, a confusing screen, a password). Pick the safe choice; Bolt says the rule: "If you're not sure, ask a grown-up!"                                                                                                                                                                             |

Each game ends with a sticker. There are no timers, no scores to lose and no buzzers: a wrong
answer just gets a gentle "let's try again".

The **grown-up corner** (gear icon, then press and hold for 3 seconds and answer a sum) has
sound and voice settings, a "test sound" button, progress reset, conversation prompts for each
game, and short notes on what the child is learning.

## Run it

```sh
npm i
npm run dev          # http://localhost:5173/robot_buddy/
```

Add `?fast` to the URL to shorten all delays (used by the tests), or `?lang=ar` for Arabic with a
right-to-left layout (`en` is the default; unknown languages fall back to English).

## Test and build

```sh
npm test             # unit tests (Vitest): classifier accuracy curve, interpreter, puzzles
npm run lint         # ESLint + Prettier check
npm run build        # type-check and build to dist/ (with service worker and manifest)
npx playwright install chromium   # once
npm run test:e2e     # Playwright smoke tests on every reference viewport
```

The Playwright suite plays every game to the end with touch emulation on the eight reference
viewports from the spec (iPad 1024×768 and 820×1180, iPad Pro 1366×1024, Android tablet 800×1280,
iPhone 390×844 and 844×390, small phone 360×640 and 640×360) plus a desktop mouse/keyboard run.
It rotates the device mid-level, and checks that no button is clipped, overlapping or below its
minimum size (88 px on tablets, 64 px on phones; picture cards 110 px / 88 px). It also checks
offline play through the service worker, no third-party requests, no console errors, and that the
game survives blocked `localStorage` and missing `speechSynthesis`.

## Deploy to GitHub Pages (free)

1. Create a GitHub repository named `robot_buddy` and push this repo's `main` branch to it.
2. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Every push to `main` runs `.github/workflows/deploy.yml`: lint, unit tests, build, and publish.
   `.github/workflows/test.yml` runs the Playwright suite.

The Vite `base` and the manifest's `scope`/`start_url` come from the repository name
(`GITHUB_REPOSITORY`), so a fork with a different name still works.

## Deploy to Vercel (free, current host)

`vercel.json` builds with `BASE_PATH=/`, so the game is served from the site root.

```sh
npx vercel login          # once
npx vercel deploy --prod  # builds on Vercel and publishes
```

## Install on a tablet or phone

Open the game's URL once while online, then:

- **iPad / iPhone (Safari):** tap **Share** → **Add to Home Screen**.
- **Android (Chrome):** tap **⋮** → **Install app** (or **Add to Home screen**).

After that first visit it works without Wi-Fi. On iPhone and iPad, sound needs one tap on the big
▶️ start button, and the ringer/silent switch must be off for sound effects.

## Project layout

```
src/
  main.ts                 router: one screen at a time, each with its own cleanup scope
  core/  audio.ts drag.ts storage.ts progress.ts i18n.ts scope.ts
  strings/  en.ts ar.ts   every visible or spoken string, keyed
  ui/    start hub sticker gate corner shell bolt dom
  levels/teach/           items.ts (dataset) classifier.ts (k-NN) session.ts scene.ts
  levels/program/         interpreter.ts (pure) puzzles.ts scene.ts
  levels/safety/          scenarios.ts scene.ts
tests/  unit/  e2e/  shared/
scripts/ gen-icons.mjs (renders public/favicon.svg to PNG icons), shots.mjs (dev screenshots)
```

## Notes and deviations from SPEC.md

- **Zoom blocking:** the viewport meta does not include `user-scalable=no`. iOS ignores it, and it
  fails Lighthouse's accessibility audit (the spec also requires ≥ 95). Pinch and double-tap zoom
  are blocked instead with `touch-action: pan-x pan-y` and gesture/multi-touch handlers.
- **Safety choices:** the spec's example pairs "don't answer" against "ask a grown-up", which are
  both safe. The wrong choices were changed to clearly unsafe ones ("tell them", "send a photo",
  "keep looking") so a child is never told a safe answer is wrong.
- **Level 1 items:** the fruit bins use 🍎 and ⚽ as the spec asks, so the test items are a pear 🍐
  and a basketball 🏀 to avoid a picture appearing as both a bin and a card.

Lighthouse (mobile and desktop presets, start screen): Performance 100, Accessibility 100,
Best Practices 100, SEO 100. Initial load is about 21 KB gzipped (JS + CSS + HTML).

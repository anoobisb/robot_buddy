# Robot Buddy: Build Spec for Claude Code

## 0. How to use this file

Put this file in an empty repo as `SPEC.md`, then start Claude Code with:

> Read SPEC.md fully. Build the project milestone by milestone (section 12). After each milestone: run tests, run the build, commit, and stop to summarise. Do not add features outside this spec. Ask me before adding any dependency not listed in section 5.

Optionally copy sections 1-4 and 10 into `CLAUDE.md` so they persist across sessions.

---

## 1. Goal

A free, browser-based game for a **5-year-old (pre-reader)** that introduces digital literacy and basic AI concepts through play. Parent plays alongside on a tablet.

Concepts the child should walk away with (kid-level, not jargon):

1. **AI learns from examples.** More examples make it better.
2. **AI makes mistakes.** People help it get better.
3. **Computers follow steps.** Order matters, and you can fix a bug.
4. **Be safe online.** Don't share personal things, ask a grown-up.

Success = she wants to replay it and can say, in her own words, "I taught the robot."

## 2. Hard constraints

- **Zero cost.** Static site only. Hosting on GitHub Pages (via GitHub Actions). No backend, no database, no paid APIs, no API keys.
- **No LLM or chatbot calls.** All dialogue is scripted.
- **Privacy:** no accounts, no analytics, no ads, no third-party scripts/fonts/CDNs at runtime, no network requests after load. No camera or microphone in v1.
- **Offline-capable** (PWA) so it works on a tablet without Wi-Fi after first load.
- **Child-safe:** no external links reachable by the child. No text input by the child. Any link is behind the grown-up gate (section 8).
- All art/audio must be license-clean (CC0/MIT/own-generated). Record sources in `ASSETS.md`.

## 3. Target device and UX rules (5-year-old)

- **Supported devices (all first-class):** iPad, Android tablets, and phones (iPhone Safari, Android Chrome), in **both portrait and landscape**. Desktop with mouse also works. No orientation lock (iOS can't enforce one): the layout must adapt live on rotate.
- **Reference viewports (design and test against all):** iPad 1024x768 and 820x1180, iPad Pro 1366x1024, Android tablet 800x1280, iPhone 390x844 (portrait) and 844x390 (landscape), small phone 360x640 (portrait) and 640x360 (landscape).
- **Responsive rules:**
  - Layout is fluid, using CSS grid/flex, `clamp()` and `vmin` units, with no fixed pixel layouts. Each scene has a **portrait variant** (bins/grid stacked vertically) and a **landscape variant** (side by side), switched via CSS media queries on `orientation` and aspect ratio.
  - Use `100dvh` (with `100vh` fallback) and `env(safe-area-inset-*)` padding so nothing hides behind notches, the iOS home bar or browser chrome. Set `viewport-fit=cover`.
  - Touch targets: >= 88 px on tablets, and never below **64 px** on small phones (scale draggables with `vmin`, minimum 88 px where space allows). Nothing may overlap or become unreachable at 360x640 / 640x360.
  - Level 2 grid scales to fit (min cell 56 px on phones); the program row wraps or scrolls horizontally without accidental page scroll.
  - Level 1 item tray holds at most 4-5 visible items on phones (paginate or shrink the tray, never shrink items below the minimum).
- **Mobile/iOS specifics:**
  - PWA meta for iOS: `apple-mobile-web-app-capable`, `apple-touch-icon` (180x180), status-bar style, plus a manifest with `display: standalone` and maskable icons. Document "Add to Home Screen" for Safari and Chrome in the README.
  - iOS only starts audio and `speechSynthesis` after a user gesture, so the "Tap to start" screen must unlock both (create or resume the AudioContext and speak a silent/short utterance inside the tap handler).
  - Handle iPhone ringer-switch/volume issues: the grown-up corner shows a "No sound? Check volume and the silent switch" hint and a "Test sound" button.
  - Block pinch-zoom and double-tap-zoom (`touch-action: manipulation`, viewport `user-scalable=no`) and rubber-band scroll without breaking dragging; prevent the iOS long-press callout and text selection.
  - Use Pointer Events with `setPointerCapture` and `touch-action: none` on draggables so drags don't scroll the page on phones.
  - Keep performance light for low-end Android phones: no heavy animation, CSS transforms only, SVG kept simple.
- **Pre-reader:** every instruction is **spoken** and **iconic**. Text is secondary and never required.
- Touch targets >= **88 px**. Draggables >= **110 px**. Generous drop zones.
- **Drag with tap fallback:** tap an item, then tap a bin, also works. Use Pointer Events (no HTML5 DnD API, which is unreliable on touch).
- **No fail states, no timers, no score loss, no "wrong" buzzers.** Mistakes are framed as "oops, let's try again" with a gentle sound.
- Immediate feedback (< 100 ms) on every touch: sound + small animation.
- Sessions are short: each level is 2-4 minutes. After each level, show a sticker reward and a "play again / next" choice with big icons.
- Prevent accidental exits: disable pinch-zoom, text selection, long-press menus, pull-to-refresh and overscroll (`touch-action`, `user-select`, CSS `overscroll-behavior`).
- Respect `prefers-reduced-motion` (swap bounces for fades).
- Colour contrast >= 4.5:1 for any text. Never rely on colour alone, and pair colour with shape/icon.
- Voice: `speechSynthesis` with a friendly, slow rate (about 0.9). Provide a **mute toggle** and a **replay-instruction button** (speaker icon) on every screen. If no voice is available, fall back to short text captions plus sound effects. Pick the best available English voice at runtime, and expose `?lang=` to switch language (see section 9).

## 4. Game overview

Single-page app. Home hub with the robot mascot, **"Bolt"** (original character, drawn by us as simple SVG, not any existing franchise), and 3 big level buttons plus a small grown-up corner.

```
Hub
 ├─ Level 1  Teach Bolt        (AI learns from examples)
 ├─ Level 2  Program Bolt      (sequencing + debugging)
 ├─ Level 3  Bolt's Safe Net   (online safety)
 └─ Grown-up corner (gated)    (conversation prompts, sound/voice settings, reset progress)
```

Progress = stickers per level, stored in `localStorage` (wrap every access in try/catch, and fall back to in-memory state).

## 5. Tech stack (approved dependencies only)

- **Vite + TypeScript**, vanilla (no React/Vue). Render with DOM + SVG + CSS. No game engine.
- **vite-plugin-pwa** (service worker + manifest).
- **Vitest** for unit tests. **Playwright** for smoke tests (touch emulation).
- ESLint + Prettier.
- No other runtime deps. Audio via Web Audio API (synthesised blips and chimes, no audio files needed) plus `speechSynthesis`.

Suggested structure:

```
/src
  main.ts              router/state machine
  core/audio.ts        sfx synth + speech wrapper (mute, replay, voice pick)
  core/drag.ts         pointer-event drag + tap fallback
  core/storage.ts      safe localStorage wrapper
  core/i18n.ts         string lookup by lang
  strings/en.ts        all spoken/visible strings (keys, not inline text)
  ui/hub.ts  ui/gate.ts  ui/sticker.ts  ui/bolt.ts (mascot states: idle/think/happy/oops)
  levels/teach/        classifier.ts  items.ts  scene.ts
  levels/program/      interpreter.ts puzzles.ts scene.ts
  levels/safety/       scenarios.ts   scene.ts
/public  icons, manifest assets
/tests   unit + e2e
ASSETS.md  SPEC.md  README.md
```

## 6. Level specs

### Level 1: Teach Bolt (AI learns from examples)

**Story:** "Bolt is a new robot. It doesn't know what a fruit is. Can you teach it?"

**Mechanic:**

- Screen: Bolt in the centre, two bins (left: 🍎 "fruit" icon, right: ⚽ "not fruit" icon), a tray of item cards (big emoji/SVG).
- Phase A (Teach): child drags an item into a bin. Each drop adds a **labelled example**. Bolt "looks" at it (eyes animate) and says "Ohh, I'm learning!"
- Phase B (Test): after N examples (start N=2, each round +2, up to 3 rounds), a "Guess time!" card appears. Bolt guesses which bin it belongs to. Child taps ✅ (right) or ❌ (not right) with the big buttons. If wrong, the child drags it to the correct bin, which adds a new example. Bolt says "Thank you! Now I know more!"
- Visible learning: a progress meter of "Bolt's brain" (filling bar or lightbulbs) grows with examples, and Bolt's guesses visibly get better over rounds.
- **Designed mistake:** include "tricky" items (tomato 🍅, coconut 🥥, bat 🦇 vs bird) so Bolt errs early. Scripted line: "Hmm, I'm not sure. I only learned from a few examples!" This teaches concept 2.
- End: Bolt gets all of round 3 right, sticker awarded, spoken recap: "The more examples you showed me, the smarter I got!"

**Classifier (real, small, deterministic):**

- Each item in `items.ts` has a hand-authored numeric feature vector (e.g. `[round, sweet, hasLeaves, growsOnTree, edible, hasFur]` in 0..1) and a hidden true label.
- `classifier.ts`: k-NN (k=1 initially, k=3 once >= 6 examples) with Euclidean distance over the labelled examples. With zero examples in a class, guess is a seeded coin flip.
- Tune the dataset so: with 2 examples Bolt gets the tricky item wrong, and with >= 6 examples it is right on all test items. **Unit-test this** (assert the accuracy curve across the scripted order so it can't regress).
- Provide at least 24 items across 3 themes (fruit/not-fruit, animals vs toys, things that fly vs not), unlock a theme per replay for variety. Keep every item instantly recognisable to a 5-year-old.

### Level 2: Program Bolt (sequencing and debugging)

**Story:** "Bolt needs to get to the battery! Tell Bolt what to do, step by step."

- 4x4 grid (grow to 5x5), Bolt start tile, goal ⭐/🔋, optional obstacles.
- Command palette: ⬆️ ⬇️ ⬅️ ➡️ (big tiles). Child taps/drops commands into a program row (max 8 slots, visual slots, no text).
- ▶️ Run button executes step by step with animation and a footstep sound; Bolt speaks "Go!" ... "I did it!".
- **Interpreter** (`interpreter.ts`) is pure and unit-tested: input grid + program, output list of states or a result of `reached_goal | hit_wall | ran_out`.
- If it fails, Bolt shows a cartoon "oops" and the program row highlights the step where it went wrong, saying "Let's find the bug!" (introduces the word "bug" gently). Child can tap a step to remove or replace it. No penalty.
- 8 puzzles, progressive: 1 step, 2 steps, a corner, an obstacle, a "fix the broken program" puzzle (a pre-filled program with one bad step) x2, and finally a repeat-block puzzle (🔁 x2) only if the milestone is stable (see section 12, stretch).
- Sticker after puzzle 4 and after puzzle 8.

### Level 3: Bolt's Safe Net (online safety)

**Story:** Short, wordless-ish cartoon scenes where Bolt is online and something happens.

- 5 scenarios, each: picture + spoken question + 2-3 big icon choices. Examples:
  1. A pop-up says "You won a prize! Tell us your address!" -> choices: type address ✍️ / ask a grown-up 🧑 (correct).
  2. A stranger in a game asks "What's your name and school?" -> don't answer ✋ / ask a grown-up (correct).
  3. Someone asks for a photo of your face -> say no / ask a grown-up (correct).
  4. A screen looks scary or confusing -> close it and tell a grown-up (correct).
  5. Sharing a password -> keep it secret 🤫 (correct) vs tell a friend.
- Wrong choice: gentle "Hmm, let's think again" + Bolt re-asks. The right choice triggers celebration and a one-line spoken rule: "If you're not sure, ask a grown-up!"
- Keep the tone calm and non-scary. No realistic stranger imagery. Use cartoon silhouettes only.

## 7. Bolt (mascot)

Original simple robot SVG, with states: `idle`, `listening` (eyes track the dragged item), `thinking` (antenna blink), `happy`, `oops` (head tilt). Built as one SVG with CSS classes so there are no image assets. Expressive, round, friendly colours.

## 8. Grown-up gate and corner

- Entry via a small gear icon. Gate: "press and hold for 3 seconds" **plus** a simple arithmetic question (e.g. 7 + 5) with number pad. Not child-guessable.
- Contents:
  - Mute / voice picker / speech rate.
  - "Reset progress".
  - **Conversation prompts** per level (3-4 questions each) such as: "Why did Bolt get it wrong the first time?", "What could we show Bolt to help?", "Who do we ask when something online feels weird?"
  - Short "what she's learning" notes in plain language.
  - Credits/licences (this is the only place external text/links may appear, and links are plain text, not clickable).

## 9. Localisation

All spoken and visible strings live in `src/strings/<lang>.ts`, keyed (e.g. `l1.intro`). Ship `en`. Add the `?lang=xx` query param and a fallback to `en`. Make adding Arabic (`ar`, RTL support via `dir`) a straightforward follow-up. Do **not** hardcode strings in components.

## 10. Quality, accessibility and non-functional

- Lighthouse: Performance >= 90, Accessibility >= 95, PWA installable.
- Initial load < 300 KB gzipped. No webfonts (use system rounded font stack).
- All interactive elements keyboard-reachable on desktop (Tab/Enter/Space) with visible focus rings, but touch is primary.
- Works offline after first load. Verify with the service worker.
- Never crash on missing `speechSynthesis`, `localStorage` or AudioContext autoplay restrictions. Resume AudioContext on first user gesture and show a big "Tap to start" screen.
- No `console` errors on any screen.
- Code is typed (strict TS), small modules, pure logic separated from DOM (classifier and interpreter must be pure and unit-tested).

## 11. Deployment (free)

- GitHub repo, `main` branch.
- `.github/workflows/deploy.yml`: build with Vite and publish to GitHub Pages via `actions/deploy-pages`.
- Vite `base` must be set from the repo name (`/<repo>/`) and the PWA manifest `scope` and `start_url` must match it.
- README: how to run (`npm i && npm run dev`), test, build, and install on a tablet ("Add to Home Screen"), and the Pages URL.
- Do not commit secrets. There should be none.

## 12. Milestones (stop and report after each)

- **M0 Scaffold:** Vite+TS, lint, Vitest, Playwright, PWA plugin, CI deploy workflow, "Tap to start" screen. Deploys to Pages.
- **M1 Core:** audio (sfx synth + speech wrapper + mute/replay), drag/tap module, storage, i18n, Bolt SVG with states, hub, sticker screen, grown-up gate and corner shell.
- **M2 Level 1:** items dataset, k-NN classifier plus accuracy-curve unit tests, full scene, 3 rounds, sticker.
- **M3 Level 2:** interpreter plus tests, 8 puzzles (without repeat block), run animation, debugging flow.
- **M4 Level 3:** 5 scenarios, feedback, sticker.
- **M5 Polish:** reduced-motion, offline verification, Lighthouse pass, grown-up prompts content, Playwright smoke test for each level with touch emulation on **all reference viewports in section 3** (tablet, iPad, phone; portrait and landscape; include a rotate-mid-level test), including assertions that no interactive element is clipped, overlapping, or smaller than its minimum target size. README and ASSETS.md.
- **Stretch (only if all above are green):** repeat-block puzzle, themes unlock in Level 1, Arabic strings plus RTL.

## 13. Definition of done

- [ ] `npm run build` and `npm test` pass; no lint errors.
- [ ] Deployed to GitHub Pages and installable on a tablet; works offline.
- [ ] A child can complete every level using only touch, with no reading, and with sound on or off.
- [ ] Verified working on iPad, Android tablet, iPhone and Android phone sizes, in portrait and landscape (Playwright viewports, plus manual check on at least one real iOS device and one Android device by the parent).
- [ ] Rotating the device mid-level preserves state and re-lays out correctly, with no lost progress.
- [ ] Audio and voice-over work on iOS Safari after the "Tap to start" gesture.
- [ ] Level 1 accuracy-curve test proves Bolt improves with more examples (and errs on tricky items early).
- [ ] No network requests after initial load (verified in the browser Network tab), no third-party scripts.
- [ ] `ASSETS.md` lists the source/licence of every asset (or states "all generated").

## 14. Out of scope (do not build)

Accounts, cloud saves, leaderboards, in-app purchases, ads, analytics, chat/LLM features, camera/mic features, multiplayer, any text entry by the child.

## 15. Notes for later (not now)

Possible v2: webcam "Show Bolt" using a Teachable Machine model running fully in-browser, with explicit parent opt-in and on-device only.

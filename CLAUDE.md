# Robot Buddy

The full brief is in `SPEC.md`; sections 1-4 and 10 are the rules that matter most. In short:

- A game for a 5-year-old pre-reader: every instruction is spoken and iconic, text is secondary.
- Static site only (GitHub Pages). No backend, LLM calls, analytics, third-party scripts/fonts, or
  network requests after load. No camera/mic. No text input by the child. Links only behind the
  grown-up gate, and never clickable.
- No fail states, timers, score loss or buzzers. Mistakes are "oops, let's try again".
- Touch targets ≥ 88 px on tablets, never < 64 px on phones; cards ≥ 110 px (88 px on phones).
  Every scene has portrait and landscape layouts and must work at all eight reference viewports.
- All strings live in `src/strings/en.ts`, keyed. Never inline text in components.
- Classifier and interpreter stay pure and unit-tested. Ask before adding any dependency not in
  SPEC.md section 5.

Commands: `npm test`, `npm run lint`, `npm run build`, `npm run test:e2e` (all viewports).

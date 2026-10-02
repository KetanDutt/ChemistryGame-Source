# Changelog

## 2.0.0 — production-ready rewrite (2026-10-02)

Full gameplay/engineering overhaul of the original prototype. Everything below
was verified with a webpack-5 build on Node 22 plus a headless-Chromium test
suite executing the real game modules.

### Bugs fixed (original code)

- **Build broken on modern Node**: webpack 4 crashed with
  `ERR_OSSL_EVP_UNSUPPORTED` on Node ≥ 17. Upgraded to webpack 5 /
  webpack-dev-server 4 / babel-loader 9 / html-webpack-plugin 5.
- **Dead game logic**: `checkBondFormation` / `dragBonds` referenced undefined
  globals (`Atoms`, `Bonds`, `this`) and were never called — bonds, win
  conditions and scoring did not exist. Replaced with a working bond graph.
- **Wrong chemistry**: original `valency = electrons` would let oxygen form 6
  bonds. Now uses real valences (H1 O2 N3 C4).
- **Shared mutable text style**: `MenuView` mutated the global
  `Utilities.textStyle` object (fontSize 30 leaked into every screen).
  `textStyle()` is now a factory.
- **NaN geometry**: `intersectionsBetweenCircles` produced NaNs for
  non-intersecting circles and mutated its inputs; now pure and null-safe.
- **Implicit globals**: views relied on `window.Phaser` leaking from the
  Phaser UMD build; every module now imports Phaser explicitly.
- **Fullscreen on any input**: any click/keypress toggled fullscreen; now an
  explicit menu button.
- **No resize handling**: `RESIZE` scale mode with empty resize callbacks left
  layouts broken; replaced by fixed logical resolution + `Scale.FIT`.
- **Leaked listeners**: `scale.on('resize')` handlers re-registered per scene
  start and never removed; removed entirely.
- **Stale committed build**: 1 MB `dist/` bundle removed from Git; `dist/` and
  `dist-test/` are now gitignored.

### Features added

- 10-level campaign (H₂ → C₂H₆) with single/double/triple bonds and locks.
- Working bond mechanics: drop-to-bond, upgrade to double/triple, ✕-badge
  breaking, atom deletion, whole-molecule dragging.
- Win detection via canonical molecule signatures; star scoring; localStorage
  persistence (unlocks, stars, mute).
- Help overlay scene reachable from menu and gameplay (pauses the game).
- Level-select menu with stars, locks and total counter.
- Animated splash screen with orbiting electrons.
- Procedural WebAudio SFX (spawn/bond/break/deny/win/stars/UI) — no assets.
- VFX: particle bursts, ring flashes, confetti, spawn pops, snap tweens,
  camera fades, starfield backdrops, hover/press button tweens.
- HUD: level label, hint, live target shopping-list chips, target silhouette
  preview, menu/restart/help/sound buttons, keyboard shortcuts.
- Docs (`docs/`), rewritten README, this changelog.

### Engineering

- `Chem.js` pure-logic module + `tests/` headless suite (`npm test`, 11
  assertions over the real modules).
- webpack 5 configs for dev / prod / tests; dev server bound to `0.0.0.0`
  with `allowedHosts: all` for remote previews.
- package.json metadata corrected (was still the phaser3-project-template's).
- `.babelrc` trailing-comma JSON error fixed.

## 1.x — original prototype

Initial covalent-bonding prototype by Ketan Dutt (Phaser 3 template).

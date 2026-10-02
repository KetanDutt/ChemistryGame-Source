# Changelog

## 2.1.0 — GitHub Pages branch deployment & CI/CD (2026-10-02)

Added a complete build-to-branch and GitHub Pages publishing system along with
expanded automated testing and documentation.

### Deployment & CI/CD

- **Branch publisher (`scripts/deploy.js`)**: zero-dependency CLI and Node
  module (`npm run deploy` / `npm run deploy:dry`) that builds `dist/`, prepares
  GitHub Pages artifacts (`.nojekyll`, `404.html` SPA fallback, optional
  `CNAME`), commits them inside an isolated temporary Git repository in
  `os.tmpdir()`, force-pushes to `refs/heads/gh-pages` without modifying or
  switching the working branch, and enables/updates GitHub Pages via the GitHub
  REST API (`/repos/{owner}/{repo}/pages`).
- **GitHub Actions workflow (`.github/workflows/deploy.yml`)**: automated
  pipeline triggered on `main` pushes and manual `workflow_dispatch` (with
  custom `branch` and `cname` inputs) that runs `npm ci`, `npm test`,
  `npm run build`, and `node scripts/deploy.js --skip-build`.
- **Production webpack config (`webpack/prod.js`)**: explicit relative
  `publicPath: ""` for GitHub Pages project subpaths
  (`/ChemistryGame-Source/`) and tuned asset size thresholds (`1.5 MB`) for
  warning-free builds.

### Testing & Documentation

- **Pure `Utilities.js`**: replaced `Phaser.Math` wrappers with standard
  `Math.hypot` and `Math.atan2`, removing the 7.5 MB Phaser bundle from the
  unit test bundle (`21.8 KiB`, 20× faster test bundling).
- **Test runner (`tests/run.js`)**: added a sandboxed Node `vm` fallback when
  no Chromium binary is installed, plus end-to-end integration tests for
  `scripts/deploy.js` pushing to an isolated bare Git repository (15 assertions
  total).
- **Documentation**: added [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) and
  updated [`README.md`](README.md), [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md),
  [`docs/GAMEPLAY.md`](docs/GAMEPLAY.md), and
  [`docs/CHEMISTRY.md`](docs/CHEMISTRY.md).

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

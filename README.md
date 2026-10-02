# Covalent Bonding — Chemistry Game

An educational browser puzzle game built with [Phaser 3](https://phaser.io). Drag atoms
into the play field and make them **share electron pairs** to rebuild target molecules —
from H₂ and water all the way to triple-bonded N₂ and ethane.

![Phaser](https://img.shields.io/badge/Phaser-3.90-5da2ff) ![Webpack](https://img.shields.io/badge/webpack-5-1c78c0) ![GitHub Pages](https://img.shields.io/badge/GitHub%20Pages-gh--pages-2ea44f) ![License](https://img.shields.io/badge/license-MIT-green)

**Live Demo (GitHub Pages):** [https://ketandutt.github.io/ChemistryGame-Source/](https://ketandutt.github.io/ChemistryGame-Source/)

## How it plays

1. **Click** an atom in the top palette (H · O · C · N) to spawn a copy.
2. **Drag** atoms around. Drop one **onto** another and they share an electron pair → a
   covalent bond forms with a spark burst.
3. Drop again on the same partner to build **double / triple bonds** (O₂, CO₂, N₂…).
4. **Click the ✕ badge** on a bond to break it; drop an atom back on the top strip to
   delete it.
5. Rebuild the **target molecule** shown at the bottom of the screen to clear the level.
   Finish fast for ★★★.

The cyan dots on each atom shell are its **free bond slots** — the game teaches real
valences: H:1 · O:2 · N:3 · C:4.

### Controls

| Input | Action |
| ----- | ------ |
| Click palette atom | spawn a copy |
| Drag | move an atom (or its whole molecule) |
| Drop atom onto atom | form / upgrade a bond |
| Click ✕ on a bond | break the bond |
| Drop on top strip | delete atom |
| `R` | restart level |
| `H` | how-to-play overlay |
| `M` | mute / unmute |
| `Esc` | back to menu |

## Levels

10 levels in chemical difficulty order:
**H₂ → H₂O → O₂ → CO₂ → NH₃ → CH₄ → N₂ → HCN → CH₂O → C₂H₆**.
Progress and stars persist in `localStorage`.

## Getting started

```bash
npm install
npm start          # dev server with hot reload on http://localhost:8080
npm run build      # production bundle in dist/
npm test           # logic + deployment test-suite (15 assertions)
npm run deploy     # build dist/, push to gh-pages branch & publish to GitHub Pages
npm run deploy:dry # dry-run build + branch commit staging without pushing
```

Requirements: Node ≥ 16. The test runner executes the webpack test bundle in headless
Chromium when available (via `$CHROME_PATH` or standard system paths) and automatically
falls back to a sandboxed Node VM when no browser is installed.

## Deployment (GitHub Pages)

The project includes both a CLI publisher ([`scripts/deploy.js`](scripts/deploy.js)) and an
automated GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)):

1. **Automated CI/CD**: Pushing to `main` (or triggering the workflow manually from the
   **Actions** tab) runs `npm test`, builds `dist/`, pushes the compiled bundle to the
   `gh-pages` branch, and publishes it to GitHub Pages.
2. **One-command CLI deploy**: Run `npm run deploy` (or `node scripts/deploy.js --branch gh-pages`)
   to build `dist/`, stage `.nojekyll` + `404.html` + `bundle.min.js` in an isolated
   temporary Git repository (leaving your current working branch untouched), force-push to
   `origin/gh-pages`, and enable/update GitHub Pages via the GitHub API.

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for all CLI flags, environment variables, and
custom domain (`CNAME`) options.

## Feature list

- 10 validated levels with real valence chemistry (single / double / triple bonds)
- Molecule dragging: bonded atoms move as one connected component
- Bond breaking, atom deletion, valence enforcement with friendly feedback
- Win detection via canonical molecule signatures (order-independent)
- Star scoring, sequential unlocks and `localStorage` persistence
- Procedural WebAudio sound effects (no audio assets) with mute persistence
- Particle bursts, ring flashes, confetti, tweens and camera fades throughout
- Responsive letterboxed scaling (plays on any window size / aspect ratio)
- Animated splash, level-select menu with stars & locks, in-game help overlay
- Headless test-suite that executes the real game modules in a browser or Node VM
- Zero-dependency build-to-branch & GitHub Pages deployment system (`npm run deploy` + GitHub Actions)

## Project layout

```
.github/
  workflows/deploy.yml   CI/CD workflow: test, build, push gh-pages & publish Pages
scripts/
  deploy.js              CLI & library to push dist/ to a branch and publish GitHub Pages
src/
  index.js               boot + Phaser config
  js/
    Constants.js         resolution, elements, layout, colours
    Levels.js            level campaign (validated at boot & by tests)
    Chem.js              pure molecule-graph logic (signatures, components)
    Utilities.js         pure math/style helpers
    Storage.js           safe localStorage persistence
    Sfx.js               procedural WebAudio SFX synth
    GameObjects/         AtomView, BondView
    UI/                  Particles (VFX), Widgets (buttons/toasts)
    Views/               SplashView, MenuView, GamePlayView, HelpView
webpack/                 base / prod / test configs
tests/                   headless logic & deploy test suite (run.js + testEntry.js)
docs/                    ARCHITECTURE, DEPLOYMENT, GAMEPLAY, CHEMISTRY notes
```

Full design notes live in [`docs/`](docs/):

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — module responsibilities, data flow, scaling, testing, deployment pipeline
- [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) — branch publishing system, CLI options, GitHub Actions CI/CD, GitHub Pages setup
- [docs/GAMEPLAY.md](docs/GAMEPLAY.md) — rules, scoring, UX decisions
- [docs/CHEMISTRY.md](docs/CHEMISTRY.md) — the chemistry model and its simplifications
- [CHANGELOG.md](CHANGELOG.md) — release history and engineering changelog

## License

MIT — see [LICENSE](LICENSE). Originally created by Ketan Dutt.

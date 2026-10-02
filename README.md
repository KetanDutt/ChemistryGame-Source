# Covalent Bonding — Chemistry Game

An educational browser puzzle game built with [Phaser 3](https://phaser.io). Drag atoms
into the play field and make them **share electron pairs** to rebuild target molecules —
from H₂ and water all the way to triple-bonded N₂ and ethane.

![Phaser](https://img.shields.io/badge/Phaser-3.90-5da2ff) ![Webpack](https://img.shields.io/badge/webpack-5-1c78c0) ![License](https://img.shields.io/badge/license-MIT-green)

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
npm start        # dev server with hot reload on http://localhost:8080
npm run build    # production bundle in dist/
npm test         # headless logic test-suite (needs a Chromium; see below)
```

Requirements: Node ≥ 16. The test runner looks for a browser via `$CHROME_PATH` or common
system paths and reports clearly if none is installed.

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
- Headless test-suite that executes the real game modules in a browser

## Project layout

```
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
tests/                   headless logic suite (run.js + testEntry.js)
docs/                    ARCHITECTURE, GAMEPLAY, CHEMISTRY notes
```

Full design notes live in [`docs/`](docs/):

- [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) — module responsibilities, data flow, scaling, testing
- [docs/GAMEPLAY.md](docs/GAMEPLAY.md) — rules, scoring, UX decisions
- [docs/CHEMISTRY.md](docs/CHEMISTRY.md) — the chemistry model and its simplifications
- [CHANGELOG.md](CHANGELOG.md) — what changed in the 2.0 production-ready rewrite

## License

MIT — see [LICENSE](LICENSE). Originally created by Ketan Dutt.

# Architecture

## Runtime overview

```
index.js ── Phaser.Game (Scale.FIT, 1280×720 logical)
   └─ scenes: SplashView → MenuView ⇄ GamePlayView (+ HelpView overlay)
```

The game uses a **fixed logical resolution (1280×720)** with
`Phaser.Scale.FIT` + `CENTER_BOTH`. The canvas letterboxes on any screen, so no
scene ever needs resize/relayout code — a deliberate replacement for the
original `RESIZE` mode, which left every object stranded on window changes.

## Module responsibilities

| Module | Role |
| ------ | ---- |
| `Constants.js` | Single source of truth: logical size, element table (radius, colour, valence), layout bands, bond tuning, storage key. |
| `Levels.js` | Declarative level campaign: atom list + bond list `[a, b, order]`. Pure data. |
| `Chem.js` | **Pure** chemistry graph logic: connected components, canonical molecule signatures, target matching, level validation, preview layout. No Phaser import → trivially testable. |
| `Utilities.js` | Pure helpers (`textStyle` factory, clamp, distance, angleBetween, circle intersections, ringAngles). Zero Phaser import; `textStyle()` returns a fresh object each call — the original mutated a shared global style object. |
| `Storage.js` | `localStorage` wrapper (unlocks, stars, mute). Every access try/catch-guarded for private-mode browsers. |
| `Sfx.js` | Procedural WebAudio synth (oscillators + noise buffers). Zero audio assets to load or license; honours persisted mute; resumes the AudioContext on first user gesture. |
| `GameObjects/AtomView.js` | Shell + nucleus + symbol + free-slot dots; drag entry point; pop/shake tweens. |
| `GameObjects/BondView.js` | Parallel bond lines (order 1–3) with shared electron dots; ✕ break badge; `addOrder()` for double/triple upgrades. |
| `UI/Particles.js` | Generated particle textures (`p-dot`, `p-spark`) + `burst`, `ring`, `confetti` VFX helpers. Textures live in the game-wide TextureManager and are generated once, guarded by `textures.exists`. |
| `UI/Widgets.js` | `makeButton` (rounded rect + hover/press tweens), `toast`, `dim`, `starfield`. |
| `Views/*` | The four scenes. |

## Core data flow (GamePlayView)

- `this.atoms: AtomView[]`, `this.bonds: BondView[]` — the whole world state.
- The bond graph is authoritative; **connected components** (`Chem.componentOf`)
  decide what moves together when dragging.
- `pointerdown` on an atom shell starts a drag (snapshot of its component).
- `pointermove` translates the component by the pointer delta.
- `pointerup` resolves the drop:
  - palette strip → delete atom (breaking its bonds),
  - bare click → nothing (never accidental bonds),
  - otherwise `tryBond`: nearest atom within `(rA+rB)·0.9`.
    - different component + both have free slots → new `BondView(order 1)` and a
      snap tween that moves *only the dragged component* (snapshotted **before**
      the bond exists — a previous bug moved the partner too and collapsed the
      bond to zero length),
    - same component + existing bond → `addOrder()` (double/triple) when
      valence allows,
    - otherwise rejection shake + toast.
- After every bond change `checkWin()` compares each component's canonical
  signature with the level target.

## Win detection

`Chem.signature(atoms, bonds)` = sorted element symbols + sorted multiset of
`"SymA|SymB|order"` bond keys, JSON-stringified. Order-independent, so any build
order matches, wrong structures (H–O–O vs H₂O) and wrong bond orders (O–O vs
O=O) do not. Level definitions are validated by `Chem.validateLevel` in the test
suite: every atom must use exactly its element's valence.

## Scene transitions

Fades are fire-and-forget (`fadeOut` + `time.delayedCall`). We deliberately do
**not** chain `camerafadeoutcomplete`, because starting a fade-out while a
fade-in is still running suppresses the completion event in Phaser 3.90 and the
transition hangs (a real bug found by the E2E suite).

## Persistence

`chemistry-game-save-v1`: `{ unlocked, stars: {levelIndex: n}, muted }`.
Written on win and on mute toggle; read lazily.

## Build tooling

- **webpack 5** on Node ≥ 16 (the original webpack 4 template fails on modern
  Node with `ERR_OSSL_EVP_UNSUPPORTED`).
- `npm start` → `webpack serve` on `0.0.0.0:8080` (preview-friendly).
- `npm run build` → minified `dist/bundle.min.js` + relative `publicPath: ""`
  (works under any GitHub Pages subpath such as `/ChemistryGame-Source/`),
  comments stripped, `dist/` gitignored on source branches.
- `npm test` → `tests/run.js`: bundles `tests/testEntry.js` with the project's
  own webpack config, executes it in headless Chromium (`puppeteer-core`) or a
  sandboxed Node `vm` fallback when no browser binary is installed, and runs
  integration tests for `scripts/deploy.js` — 15 assertions total.
- `npm run deploy` → `scripts/deploy.js`: builds `dist/`, prepares GitHub Pages
  files (`.nojekyll`, `404.html`, optional `CNAME`), commits them inside an
  isolated temporary Git repository, force-pushes to `refs/heads/gh-pages`
  without touching the checked-out working branch, and configures/publishes
  GitHub Pages via the GitHub REST API.

## Deployment pipeline

- **CLI / programmatic (`scripts/deploy.js`)**: zero external npm dependencies.
  Stages `dist/` into `os.tmpdir()`, pushes to the target branch (`gh-pages` by
  default), and calls `/repos/{owner}/{repo}/pages` (`GITHUB_TOKEN` or `gh api`)
  to enable or update GitHub Pages from that branch.
- **GitHub Actions (`.github/workflows/deploy.yml`)**: triggers on pushes to
  `main` or manual `workflow_dispatch`, runs `npm ci` → `npm test` →
  `npm run build` → `node scripts/deploy.js --skip-build`, and writes a build &
  live-URL summary to `$GITHUB_STEP_SUMMARY`.
- See [docs/DEPLOYMENT.md](DEPLOYMENT.md) for full CLI flags, environment
  variables, and GitHub Pages configuration details.

## Testing strategy

1. **Logic & deployment suite** (`npm test`):
   - 12 pure-module assertions over `Chem`, `Levels`, `Constants` and
     `Utilities` (chemistry validity, signatures, components, layout, geometry
     and style helpers).
   - 3 deployment system assertions over `scripts/deploy.js` (CLI/env argument
     parsing, GitHub remote/Pages URL resolution, and end-to-end branch push to
     an isolated bare Git repository verifying `.nojekyll`, `404.html`, `CNAME`,
     `bundle.min.js`, and `index.html` while keeping the working branch intact).
2. **Manual/E2E recipe**: drive the built bundle with a scripted browser (see
   `tests/run.js` for the launch flags that make headless WebGL work:
   `--use-angle=swiftshader --enable-unsafe-swiftshader`). A full playthrough
   of levels 1–3 including bond breaking, double bonds, help overlay and
   persistence has been verified this way.

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
| `Utilities.js` | Pure helpers (`textStyle` factory, clamp, distance, circle intersections). `textStyle()` returns a fresh object each call — the original mutated a shared global style object. |
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
- `npm run build` → minified `dist/bundle.min.js` + hashed-free stable name,
  comments stripped, `dist/` gitignored.
- `npm test` → `tests/run.js`: bundles `tests/testEntry.js` with the project's
  own webpack config and executes it in headless Chromium (puppeteer-core, no
  bundled browser download). The suite exercises the **real** `Chem`, `Levels`
  and `Utilities` modules — 11 assertions.

## Testing strategy

1. **Logic suite** (`npm test`): pure-module assertions in a real browser
   context (chemistry validity, signatures, components, layout, helpers).
2. **Manual/E2E recipe**: drive the built bundle with a scripted browser (see
   `tests/run.js` for the launch flags that make headless WebGL work:
   `--use-angle=swiftshader --enable-unsafe-swiftshader`). A full playthrough
   of levels 1–3 including bond breaking, double bonds, help overlay and
   persistence has been verified this way.

# Gameplay & UX design

## Loop

Spawn → drag → share electrons → match the target silhouette → earn stars →
next level. Every level is a single screen; there is nothing to read before
playing, and the help overlay (`H` or the HOW button) is always one key away.

## Rules

- **Valence is the rulebook.** H:1 · O:2 · N:3 · C:4 free bond slots, shown as
  cyan dots on the shell. An atom with no free slots rejects new bonds with a
  shake, a buzz and a toast explaining why.
- **Bonds are shared pairs.** A bond renders 1/2/3 parallel lines with a dot
  pair per line — the visual *is* the chemistry lesson.
- **Drop-to-bond.** Dropping an atom within 90 % of the combined radii of a
  partner bonds them; the dragged molecule then tweens to the ideal bond
  length (72 % of combined radii) so molecules rest in a readable shape.
- **Upgrade by re-dropping** on the same partner (double/triple, max 3).
- **Break** with the ✕ badge on the bond; **delete** by dropping on the top
  strip. Both restore valence slots.
- **Molecules move as one.** Dragging any atom drags its whole connected
  component, so built fragments stay intact.

## Scoring & progression

- Stars by completion time relative to molecule size:
  `★★★ ≤ atoms·5s + 5s`, `★★ ≤ atoms·10s + 12s`, else `★`.
- Best stars per level and the unlock frontier persist locally.
- The menu shows locks, best stars and the running `★ x/30` total.

## UX decisions (and why)

- **Fixed logical resolution + FIT scaling** instead of runtime relayout:
  pixel-consistent design on every aspect ratio, zero resize bugs.
- **Bare clicks never bond or break.** Only intentional drags change the
  world; a click on a palette atom just places a copy below the strip.
- **Explicit break handle** (✕ badge): bond lines are thin targets that sit
  under atom shells, so an invisible hit-rect was unclickable in practice.
- **No auto-fullscreen.** The original toggled fullscreen on *any* key or
  click; now it is an opt-in menu button.
- **Feedback everywhere**: spawn pop, snap tween, spark burst + ring on bond,
  red puff on break, confetti + star pops on win, toasts for every rejection.
- **Procedural audio**: every action has a distinct synth blip; the palette is
  pitched so bond/break/win are recognisable without looking.

## Accessibility notes

- All text is DOM-free Phaser text at ≥13 px logical with high contrast.
- Buttons use hand cursor + hover scale; bonds show pointer cursor on hover.
- Keyboard shortcuts for restart/help/mute/menu.

## Related documentation

- [README.md](../README.md) — quick start, controls and project overview
- [docs/ARCHITECTURE.md](ARCHITECTURE.md) — runtime architecture, build tooling and test suite
- [docs/DEPLOYMENT.md](DEPLOYMENT.md) — branch publishing system and GitHub Pages deployment
- [docs/CHEMISTRY.md](CHEMISTRY.md) — covalent bonding model and level campaign

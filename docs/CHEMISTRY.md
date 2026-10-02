# Chemistry model

## What the game teaches

Covalent bonding as **electron-pair sharing** between non-metals, with real
neutral-molecule valences:

| Element | Symbol | Bonds formed | Valence electrons |
| ------- | ------ | ------------ | ----------------- |
| Hydrogen | H | 1 | 1 |
| Oxygen   | O | 2 | 6 |
| Carbon   | C | 4 | 4 |
| Nitrogen | N | 3 | 5 |

Multiple bonds are first-class: O₂ (double), N₂ (triple), CO₂ (two doubles),
HCN (single + triple), CH₂O (double + two singles).

## Level set

| # | Molecule | Formula | Bonds |
| - | -------- | ------- | ----- |
| 1 | Hydrogen | H₂ | H–H |
| 2 | Water | H₂O | 2 × O–H |
| 3 | Oxygen | O₂ | O=O |
| 4 | Carbon dioxide | CO₂ | 2 × C=O |
| 5 | Ammonia | NH₃ | 3 × N–H |
| 6 | Methane | CH₄ | 4 × C–H |
| 7 | Nitrogen | N₂ | N≡N |
| 8 | Hydrogen cyanide | HCN | H–C, C≡N |
| 9 | Formaldehyde | CH₂O | 2 × C–H, C=O |
| 10 | Ethane | C₂H₆ | C–C + 6 × C–H |

Every definition is machine-validated (`Chem.validateLevel`): each atom's bond
orders must sum exactly to its valence, so a chemically impossible level can
never ship.

## Matching & deliberate simplifications

- A built molecule wins when its **signature** (sorted elements + sorted
  multiset of `element|element|order` bond keys) equals the target's. This is
  bond-topology matching: correct atoms *and* correct bond orders.
- Isomers with identical bond multisets would compare equal — none exist in
  the level set, and at this scope that is acceptable.
- Lone pairs are not drawn as such; free slots stand in for them. Geometry is
  2D and decorative (real VSEPR angles are not enforced).
- No charges/ions, no resonance, no radicals: the game models stable neutral
  molecules only, which is exactly the school curriculum it targets.

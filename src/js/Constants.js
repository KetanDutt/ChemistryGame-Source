// Central configuration for the whole game: logical resolution, palette
// elements, layout bands, colours and storage keys.

export const GAME_WIDTH = 1280;
export const GAME_HEIGHT = 720;

export const SceneKeys = {
    Splash: "SplashView",
    Menu: "MenuView",
    Game: "GamePlayView",
    Help: "HelpView"
};

// Playable elements. `bonds` is the number of covalent bonds the atom forms
// in stable neutral molecules (H 1, O 2, N 3, C 4) — this is the chemistry
// the game teaches. `electrons` is kept for reference/valence-electron
// display in the docs and help screens.
export const ELEMENTS = {
    H: { symbol: "H", name: "Hydrogen", rad: 42, color: 0xdfe8ff, dark: 0x27303f, bonds: 1, electrons: 1 },
    O: { symbol: "O", name: "Oxygen",   rad: 60, color: 0xff6b5d, dark: 0x3d2321, bonds: 2, electrons: 6 },
    C: { symbol: "C", name: "Carbon",   rad: 52, color: 0xaebfd0, dark: 0x252c36, bonds: 4, electrons: 4 },
    N: { symbol: "N", name: "Nitrogen", rad: 56, color: 0x5da2ff, dark: 0x1c2c45, bonds: 3, electrons: 5 }
};

export const PALETTE = ["H", "O", "C", "N"];

// Vertical bands of the play field (logical pixels).
export const LAYOUT = {
    paletteY: 108,         // centre line of the atom palette strip
    paletteStripH: 178,    // dropping an atom above this line deletes it
    fieldTop: 190,
    fieldBottom: 560,
    previewY: 640          // centre line of the target-molecule preview
};

export const COLORS = {
    bg: 0x0b0e17,
    stripTop: 0x10141d,
    stripBottom: 0x0d1119,
    hud: 0x9fb4d8,
    accent: 0x53d8e8,
    electron: 0x35e0ff,
    bond: 0xf4f7ff,
    good: 0x7dffa8,
    bad: 0xff7d7d,
    star: 0xffd75e
};

// Physics-ish tuning of the bond mechanic.
export const BOND = {
    grabDistFactor: 0.9,   // atoms closer than (rA+rB)*factor on drop will bond
    idealFactor: 0.72,     // resting bond length as a fraction of (rA+rB)
    lineWidth: 4
};

export const STORAGE_KEY = "chemistry-game-save-v1";

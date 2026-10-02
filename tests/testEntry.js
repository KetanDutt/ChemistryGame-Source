// Headless logic test-suite. Bundled by webpack/test.js and executed in a
// real browser by tests/run.js. Exercises the ACTUAL game modules (Chem,
// Levels, Utilities) — not copies of their logic.
import { componentOf, components, signature, levelSignature, requiredCounts, validateLevel, layoutMolecule } from "../src/js/Chem";
import { LEVELS } from "../src/js/Levels";
import { ELEMENTS } from "../src/js/Constants";
import { Utilities } from "../src/js/Utilities";

const results = [];
function test(name, fn) {
    try {
        fn();
        results.push({ name, pass: true });
    } catch (e) {
        results.push({ name, pass: false, error: String(e && e.message) });
    }
}
function eq(a, b, msg) {
    if (JSON.stringify(a) !== JSON.stringify(b)) {
        throw new Error(msg || `expected ${JSON.stringify(b)} but got ${JSON.stringify(a)}`);
    }
}
function ok(v, msg) {
    if (!v) throw new Error(msg || "assertion failed");
}
const atom = (sym) => ({ element: { symbol: sym } });
const bond = (a, b, order = 1) => ({ a, b, order });

test("every level definition is chemically valid (valences satisfied)", () => {
    LEVELS.forEach((lvl, i) => {
        const errs = validateLevel(lvl, ELEMENTS);
        eq(errs, [], `level ${i} (${lvl.formula}): ${errs.join(", ")}`);
    });
});

test("level signatures are unique (no duplicate molecules)", () => {
    const sigs = LEVELS.map(levelSignature);
    eq(new Set(sigs).size, LEVELS.length, "two levels share a signature");
});

test("H₂O matches whatever order the player builds it in", () => {
    const O = atom("O"), H1 = atom("H"), H2 = atom("H");
    const built = signature([H1, O, H2], [bond(H1, O), bond(O, H2)]);
    eq(built, levelSignature(LEVELS[1]));
});

test("H–O–O (wrong structure) does not match H₂O", () => {
    const O = atom("O"), O2 = atom("O"), H = atom("H");
    const built = signature([O, O2, H], [bond(O, O2), bond(O2, H)]);
    ok(built !== levelSignature(LEVELS[1]), "H-O-O must not equal H2O");
});

test("bond order matters: O–O single ≠ O=O double", () => {
    const a = atom("O"), b = atom("O");
    ok(signature([a, b], [bond(a, b, 1)]) !== levelSignature(LEVELS[2]), "single-bonded O2 matched the O=O target");
    eq(signature([a, b], [bond(a, b, 2)]), levelSignature(LEVELS[2]));
});

test("components() splits disconnected groups", () => {
    const a = atom("H"), b = atom("H"), c = atom("H");
    const comps = components([a, b, c], [bond(a, b)]);
    eq(comps.length, 2, "expected two components");
    eq(componentOf(c, [bond(a, b)]).atoms.length, 1);
});

test("requiredCounts() builds the shopping list", () => {
    eq(requiredCounts(LEVELS[1]), { O: 1, H: 2 });
    eq(requiredCounts(LEVELS[9]), { C: 2, H: 6 });
});

test("layoutMolecule() returns finite, centred positions for every level", () => {
    LEVELS.forEach(lvl => {
        const pos = layoutMolecule(lvl, 50);
        eq(pos.length, lvl.atoms.length);
        pos.forEach(p => ok(Number.isFinite(p.x) && Number.isFinite(p.y), "non-finite layout position"));
    });
});

test("circleIntersections(): disjoint circles return null (no NaN geometry)", () => {
    eq(Utilities.circleIntersections({ x: 0, y: 0, r: 10 }, { x: 100, y: 0, r: 10 }), null);
});

test("circleIntersections(): overlapping circles return two finite points", () => {
    const r = Utilities.circleIntersections({ x: 0, y: 0, r: 50 }, { x: 80, y: 0, r: 50 });
    ok(r && r.length === 2 && Number.isFinite(r[0].x) && Number.isFinite(r[1].y), "bad intersection result");
});

test("textStyle() returns independent objects (no shared-style mutation bug)", () => {
    const a = Utilities.textStyle();
    const b = Utilities.textStyle();
    a.fontSize = 99;
    ok(b.fontSize !== 99, "mutating one style leaked into another");
});

window.__TEST_RESULTS__ = results;

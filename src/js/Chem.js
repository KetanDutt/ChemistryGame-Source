// Pure chemistry/molecule-graph logic. No Phaser dependency so it can run in
// Node-free browser tests and is trivially unit-testable.
//
// A built molecule is a set of AtomView-like objects ({element, bonds:[...]})
// connected by BondView-like objects ({a, b, order}). A *component* is a
// connected group of atoms. A component *wins* when its bond/atom signature
// equals the target level signature.

// Breadth-first search of every atom connected to `root` through `bonds`.
export function componentOf(root, bonds) {
    const seen = new Set([root]);
    const queue = [root];
    const local = new Set();
    while (queue.length) {
        const atom = queue.pop();
        for (const bond of bonds) {
            if (bond.a !== atom && bond.b !== atom) continue;
            local.add(bond);
            const other = bond.a === atom ? bond.b : bond.a;
            if (!seen.has(other)) {
                seen.add(other);
                queue.push(other);
            }
        }
    }
    return { atoms: [...seen], bonds: [...local] };
}

// Splits a set of atoms into connected components.
export function components(atoms, bonds) {
    const seen = new Set();
    const out = [];
    for (const atom of atoms) {
        if (seen.has(atom)) continue;
        const comp = componentOf(atom, bonds);
        comp.atoms.forEach(a => seen.add(a));
        out.push(comp);
    }
    return out;
}

// Canonical, order-independent description of a molecule:
//  - sorted element symbols
//  - sorted multiset of "Symbol|Symbol|order" bond keys
// Two molecules that stringify identically are (for the scope of this game)
// the same molecule. e.g. H-O-H and H-O-H built in any order both yield
// {"atoms":["H","H","O"],"bonds":["H|O|1","H|O|1"]}.
export function signature(atoms, bonds) {
    const atomKeys = atoms.map(a => a.element.symbol).sort();
    const bondKeys = bonds.map(b => {
        const pair = [b.a.element.symbol, b.b.element.symbol].sort();
        return `${pair[0]}|${pair[1]}|${b.order}`;
    }).sort();
    return JSON.stringify({ atoms: atomKeys, bonds: bondKeys });
}

export function levelSignature(level) {
    const atoms = level.atoms.map(s => ({ element: { symbol: s } }));
    const bonds = level.bonds.map(([i, j, order]) => ({ a: atoms[i], b: atoms[j], order }));
    return signature(atoms, bonds);
}

// {H:2, O:1} atom shopping list of a level.
export function requiredCounts(level) {
    const counts = {};
    level.atoms.forEach(s => { counts[s] = (counts[s] || 0) + 1; });
    return counts;
}

export function currentCounts(atoms) {
    const counts = {};
    atoms.forEach(a => {
        const s = a.element.symbol;
        counts[s] = (counts[s] || 0) + 1;
    });
    return counts;
}

// Validates a level definition is chemically sound: every atom uses exactly
// as many bond orders as its element allows. Returns array of error strings.
export function validateLevel(level, elements) {
    const errors = [];
    const order = new Array(level.atoms.length).fill(0);
    level.bonds.forEach(([i, j, o], bi) => {
        if (i === j) errors.push(`bond ${bi} is a self-loop`);
        if (i == null || j == null || i >= level.atoms.length || j >= level.atoms.length) {
            errors.push(`bond ${bi} references a missing atom`);
            return;
        }
        order[i] += o;
        order[j] += o;
    });
    level.atoms.forEach((sym, i) => {
        const allowed = elements[sym] && elements[sym].bonds;
        if (allowed == null) {
            errors.push(`unknown element ${sym}`);
        } else if (order[i] !== allowed) {
            errors.push(`${sym}#${i} uses ${order[i]} bond(s) but wants ${allowed}`);
        }
    });
    return errors;
}

// Tiny radial layout used to draw the target-molecule preview silhouette.
// BFS from atom 0; children fan out away from their parent.
export function layoutMolecule(level, spacing) {
    const n = level.atoms.length;
    const pos = new Array(n).fill(null);
    pos[0] = { x: 0, y: 0 };
    const adj = Array.from({ length: n }, () => []);
    level.bonds.forEach(([i, j]) => { adj[i].push(j); adj[j].push(i); });
    const queue = [0];
    const seen = new Set([0]);
    while (queue.length) {
        const i = queue.shift();
        const children = adj[i].filter(j => !seen.has(j));
        children.forEach(j => seen.add(j));
        const parent = i === 0 ? null : adj[i].find(j => seen.has(j) && pos[j] && j !== i && !children.includes(j));
        const inAngle = parent != null ? Math.atan2(pos[i].y - pos[parent].y, pos[i].x - pos[parent].x) : 0;
        const m = children.length;
        children.forEach((j, k) => {
            const spread = m === 1 ? 0 : (k - (m - 1) / 2) * (Math.PI / 2.2);
            const a = inAngle + spread;
            pos[j] = { x: pos[i].x + Math.cos(a) * spacing, y: pos[i].y + Math.sin(a) * spacing };
            queue.push(j);
        });
    }
    // Centre the layout on its bounding box.
    const xs = pos.map(p => p.x), ys = pos.map(p => p.y);
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
    const cy = (Math.min(...ys) + Math.max(...ys)) / 2;
    return pos.map(p => ({ x: p.x - cx, y: p.y - cy }));
}

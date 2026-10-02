import Phaser from "phaser";

// Small pure helpers shared across the game. Everything here is side-effect
// free; in particular `textStyle` returns a *fresh* object on every call so
// callers can never mutate a shared style (an actual bug in the original
// code base, where editing the shared style leaked into every screen).
export const Utilities = {
    textStyle(opts = {}) {
        return Object.assign({
            fontFamily: '"Trebuchet MS", Verdana, Arial, sans-serif',
            fontSize: 20,
            color: "#ffffff",
            align: "center"
        }, opts);
    },

    clamp(v, min, max) {
        return v < min ? min : (v > max ? max : v);
    },

    distance(x1, y1, x2, y2) {
        return Phaser.Math.Distance.Between(x1, y1, x2, y2);
    },

    angleBetween(x1, y1, x2, y2) {
        return Phaser.Math.Angle.Between(x1, y1, x2, y2);
    },

    // Intersection points of two circles; used to draw the electron "arc"
    // slots the same way the original game did. Returns null when the circles
    // do not intersect (the original code produced NaN geometry instead).
    circleIntersections(c1, c2) {
        const dx = c2.x - c1.x;
        const dy = c2.y - c1.y;
        const d = Math.hypot(dx, dy);
        if (d === 0 || d > c1.r + c2.r || d < Math.abs(c1.r - c2.r)) return null;
        const a = (c1.r * c1.r - c2.r * c2.r + d * d) / (2 * d);
        const h2 = c1.r * c1.r - a * a;
        const h = h2 > 0 ? Math.sqrt(h2) : 0;
        const mx = c1.x + a * dx / d;
        const my = c1.y + a * dy / d;
        return [
            { x: mx + h * dy / d, y: my - h * dx / d },
            { x: mx - h * dy / d, y: my + h * dx / d }
        ];
    },

    // Evenly distributes `count` angles (radians) around a circle starting at
    // the top; used to position free-bond slots on an atom shell.
    ringAngles(count, offset = -Math.PI / 2) {
        const out = [];
        for (let i = 0; i < count; i++) out.push(offset + (i * Math.PI * 2) / count);
        return out;
    }
};

import { COLORS, BOND } from "../Constants";

// A covalent bond between two AtomViews. Renders `order` parallel bond lines
// (single/double/triple) with a shared electron pair on each line, and owns
// an invisible hit-rectangle so the player can click the bond to break it.
export class BondView {
    constructor(scene, a, b, order = 1) {
        this.scene = scene;
        this.a = a;
        this.b = b;
        this.order = order;

        a.bonds.push(this);
        b.bonds.push(this);
        a.freeBonds -= order;
        b.freeBonds -= order;
        a.drawSlots();
        b.drawSlots();

        this.graphics = scene.add.graphics().setDepth(5);

        // Explicit break handle at the bond midpoint, layered above atoms so
        // it is always clickable.
        this.badgeBg = scene.add.circle(0, 0, 13, 0x1a2436, 0.95)
            .setStrokeStyle(1.5, 0x3a4a66, 1)
            .setDepth(65);
        this.badgeX = scene.add.text(0, 0, "✕", {
            fontFamily: "Verdana, Arial, sans-serif", fontSize: 13, color: "#8fa3c4", fontStyle: "bold"
        }).setOrigin(0.5).setDepth(66);
        this.badgeBg.setInteractive({ useHandCursor: true })
            .on("pointerdown", () => { if (this.onClick) this.onClick(this); })
            .on("pointerover", () => { scene.input.setDefaultCursor("pointer"); this.hover = true; this.badgeX.setColor("#ffffff"); this.refresh(); })
            .on("pointerout", () => { scene.input.setDefaultCursor("default"); this.hover = false; this.badgeX.setColor("#8fa3c4"); this.refresh(); });

        this.onClick = null;
        this.flash = 1; // formation flash timer, decays in refresh()
        this.refresh();
    }

    // Used by the help-screen demo bond (visible but not clickable).
    setInteractiveActive(on) {
        if (on) this.badgeBg.setInteractive({ useHandCursor: true });
        else this.badgeBg.disableInteractive();
        this.badgeBg.setVisible(on);
        this.badgeX.setVisible(on);
    }

    // Perpendicular offsets of the parallel lines for a given bond order.
    static offsets(order) {
        if (order === 1) return [0];
        if (order === 2) return [-6, 6];
        return [-8, 0, 8];
    }

    refresh() {
        const g = this.graphics;
        g.clear();
        const ax = this.a.x, ay = this.a.y, bx = this.b.x, by = this.b.y;
        const dist = Math.hypot(bx - ax, by - ay) || 1;
        const ux = (bx - ax) / dist, uy = (by - ay) / dist;   // along bond
        const px = -uy, py = ux;                              // perpendicular

        // Keep the break handle centred on the bond even when the draw below
        // bails out for fully overlapping atoms.
        this.badgeBg.setPosition((ax + bx) / 2, (ay + by) / 2);
        this.badgeX.setPosition((ax + bx) / 2, (ay + by) / 2);

        // Draw from nucleus edge to nucleus edge so the line is visible over
        // the overlapping shells but never over the element symbols.
        const start = this.a.element.rad * 0.5;
        const end = dist - this.b.element.rad * 0.5;
        if (end <= start) return;

        const flashBoost = this.flash > 0 ? this.flash : 0;
        this.flash = Math.max(0, this.flash - 0.05);

        const widths = BOND.lineWidth + flashBoost * 3;
        const alpha = Math.min(1, 0.85 + flashBoost * 0.15);

        BondView.offsets(this.order).forEach(off => {
            const sx = ax + ux * start + px * off;
            const sy = ay + uy * start + py * off;
            const ex = ax + ux * end + px * off;
            const ey = ay + uy * end + py * off;
            g.lineStyle(widths, this.hover ? 0xffffff : COLORS.bond, alpha);
            g.beginPath();
            g.moveTo(sx, sy);
            g.lineTo(ex, ey);
            g.strokePath();

            // The shared electron pair riding this bond line.
            const mx = (sx + ex) / 2, my = (sy + ey) / 2;
            g.fillStyle(COLORS.electron, 1);
            g.fillCircle(mx - ux * 7, my - uy * 7, 4);
            g.fillCircle(mx + ux * 7, my + uy * 7, 4);
        });

    }

    // Upgrade single→double→triple by consuming one more slot on each atom.
    addOrder() {
        if (this.order >= 3) return;
        this.order += 1;
        this.a.freeBonds -= 1;
        this.b.freeBonds -= 1;
        this.a.drawSlots();
        this.b.drawSlots();
        this.flash = 1;
        this.refresh();
    }

    midPoint() {
        return { x: (this.a.x + this.b.x) / 2, y: (this.a.y + this.b.y) / 2 };
    }

    involves(atom) {
        return this.a === atom || this.b === atom;
    }

    other(atom) {
        return this.a === atom ? this.b : this.a;
    }

    destroy() {
        this.a.bonds = this.a.bonds.filter(b => b !== this);
        this.b.bonds = this.b.bonds.filter(b => b !== this);
        this.a.freeBonds += this.order;
        this.b.freeBonds += this.order;
        this.a.drawSlots();
        this.b.drawSlots();
        this.badgeBg.destroy();
        this.badgeX.destroy();
        this.graphics.destroy();
    }
}

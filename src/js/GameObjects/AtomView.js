import Phaser from "phaser";
import { ELEMENTS, COLORS } from "../Constants";
import { Utilities } from "../Utilities";

let NEXT_ID = 1;

// Visual + interactive representation of one atom.
// Shell circle (electron cloud), nucleus, element symbol and one cyan dot
// per *free* covalent bond slot. Dots sit at fixed positions for the element
// so players see slots disappear as bonds are consumed.
export class AtomView {
    constructor(scene, x, y, elementKey, opts = {}) {
        this.scene = scene;
        this.id = NEXT_ID++;
        this.element = ELEMENTS[elementKey];
        this.elementKey = elementKey;
        this.x = x;
        this.y = y;
        this.freeBonds = this.element.bonds;
        this.bonds = [];
        this.isPalette = !!opts.palette;
        this.onDown = opts.onDown || null;

        const e = this.element;
        this.shell = scene.add.circle(x, y, e.rad)
            .setStrokeStyle(2, e.color, 0.95)
            .setFillStyle(0x000000, 0.0001); // invisible fill = full-area hit target
        this.nucleus = scene.add.circle(x, y, e.rad * 0.52)
            .setFillStyle(e.dark, 1)
            .setStrokeStyle(1.5, e.color, 0.8);
        this.symbol = scene.add.text(x, y, e.symbol, Utilities.textStyle({
            fontSize: Math.round(e.rad * 0.62),
            color: "#ffffff"
        })).setOrigin(0.5);
        this.slots = scene.add.graphics();

        this.parts = [this.shell, this.nucleus, this.symbol, this.slots];
        this.drawSlots();

        const down = (pointer) => { if (this.onDown) this.onDown(this, pointer); };
        this.shell.setInteractive().on("pointerdown", down);
        this.nucleus.setInteractive().on("pointerdown", down);

        const over = () => { if (!this.isPalette) this.shell.setStrokeStyle(3, e.color, 1); };
        const out = () => this.shell.setStrokeStyle(2, e.color, 0.95);
        this.shell.on("pointerover", over).on("pointerout", out);
        scene.input.setDefaultCursor("default");
    }

    // Free-bond dots at the element's canonical slot angles.
    drawSlots() {
        const g = this.slots;
        g.clear();
        const angles = Utilities.ringAngles(this.element.bonds);
        for (let i = 0; i < this.freeBonds; i++) {
            const a = angles[i];
            const px = this.x + Math.cos(a) * this.element.rad;
            const py = this.y + Math.sin(a) * this.element.rad;
            g.fillStyle(COLORS.electron, 1);
            g.fillCircle(px, py, 4.5);
            g.lineStyle(1, COLORS.electron, 0.6);
            g.strokeCircle(px, py, 7);
        }
    }

    moveTo(x, y) {
        this.x = x;
        this.y = y;
        this.shell.setPosition(x, y);
        this.nucleus.setPosition(x, y);
        this.symbol.setPosition(x, y);
        this.drawSlots();
    }

    moveBy(dx, dy) {
        this.moveTo(this.x + dx, this.y + dy);
    }

    // Entrance pop used when spawning copies.
    popIn() {
        this.parts.forEach(p => p.setScale(0.01));
        this.scene.tweens.add({
            targets: this.parts,
            scale: 1,
            duration: 260,
            ease: "Back.Out",
            onComplete: () => this.parts.forEach(p => p.setScale(1))
        });
    }

    // Rejection wiggle: oscillates around the resting point, then settles.
    shake() {
        const ox = this.x;
        const oy = this.y;
        const state = { t: 0 };
        this.scene.tweens.add({
            targets: state,
            t: 1,
            duration: 260,
            ease: "Linear",
            onUpdate: () => {
                const off = Math.sin(state.t * Math.PI * 4) * 7 * (1 - state.t);
                this.moveTo(ox + off, oy);
            },
            onComplete: () => this.moveTo(ox, oy)
        });
    }

    setDepth(d) {
        this.parts.forEach(p => p.setDepth(d));
        return this;
    }

    setAlpha(a) {
        this.parts.forEach(p => p.setAlpha(a));
        return this;
    }

    highlight(on) {
        this.shell.setStrokeStyle(on ? 4 : 2, on ? 0xffffff : this.element.color, 1);
    }

    destroy() {
        this.shell.removeAllListeners();
        this.nucleus.removeAllListeners();
        this.parts.forEach(p => p.destroy());
    }
}

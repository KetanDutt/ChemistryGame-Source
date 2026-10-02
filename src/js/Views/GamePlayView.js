import Phaser from "phaser";
import { SceneKeys, GAME_WIDTH, GAME_HEIGHT, LAYOUT, COLORS, PALETTE, ELEMENTS, BOND } from "../Constants";
import { Utilities } from "../Utilities";
import { LEVELS } from "../Levels";
import { Storage } from "../Storage";
import { Sfx } from "../Sfx";
import { componentOf, components, signature, levelSignature, requiredCounts, currentCounts, layoutMolecule } from "../Chem";
import { AtomView } from "../GameObjects/AtomView";
import { BondView } from "../GameObjects/BondView";
import { ensureTextures, burst, ring, confetti } from "../UI/Particles";
import { makeButton, toast, dim, starfield } from "../UI/Widgets";

// Core puzzle scene: spawn atoms, drag them, share electrons to bond,
// rebuild the target molecule to clear the level.
export class GamePlayView extends Phaser.Scene {
    constructor() {
        super({ key: SceneKeys.Game });
    }

    init(data) {
        this.levelIndex = (data && data.level != null) ? data.level : 0;
        this.level = LEVELS[this.levelIndex];
    }

    create() {
        this.sfx = new Sfx(this);
        ensureTextures(this);
        starfield(this);
        this.cameras.main.fadeIn(350, 11, 14, 23);

        this.atoms = [];
        this.bonds = [];
        this.drag = null;
        this.paused = false;
        this.won = false;
        this.startMs = this.time.now;

        this.drawBackground();
        this.drawHud();
        this.drawPalette();
        this.drawTargetPreview();

        // ---- global input -------------------------------------------------
        this.input.on("pointermove", (pointer) => this.onPointerMove(pointer));
        this.input.on("pointerup", (pointer) => this.onPointerUp(pointer));

        this.input.keyboard.on("keydown-R", () => this.restart());
        this.input.keyboard.on("keydown-M", () => this.toggleSound());
        this.input.keyboard.on("keydown-H", () => this.openHelp());
        this.input.keyboard.on("keydown-ESC", () => this.toMenu());

        this.events.on("shutdown", () => {
            if (this.soundBtn) this.soundBtn = null;
        });
    }

    // ------------------------------------------------------------------ view
    drawBackground() {
        this.add.rectangle(GAME_WIDTH / 2, LAYOUT.paletteY + 8, GAME_WIDTH, LAYOUT.paletteStripH + 16, COLORS.stripTop).setDepth(-5);
        this.add.rectangle(GAME_WIDTH / 2, LAYOUT.previewY, GAME_WIDTH, GAME_HEIGHT - LAYOUT.previewY + 60, COLORS.stripBottom).setDepth(-5);
        this.add.rectangle(GAME_WIDTH / 2, (LAYOUT.fieldTop + LAYOUT.fieldBottom) / 2, GAME_WIDTH, LAYOUT.fieldBottom - LAYOUT.fieldTop, 0x0d1420).setDepth(-6);
    }

    drawHud() {
        this.add.text(28, 26, `LEVEL ${this.levelIndex + 1}/${LEVELS.length}  ·  ${this.level.name}  ${this.level.formula}`, Utilities.textStyle({
            fontSize: 20, fontStyle: "bold", color: "#eaf3ff", align: "left"
        })).setOrigin(0, 0.5).setDepth(1000);

        const btnY = 26;
        makeButton(this, GAME_WIDTH - 470, btnY, "MENU", () => this.toMenu(), { fontSize: 14 }).setDepth(1001);
        makeButton(this, GAME_WIDTH - 360, btnY, "RESTART", () => this.restart(), { fontSize: 14 }).setDepth(1001);
        makeButton(this, GAME_WIDTH - 240, btnY, "HOW", () => this.openHelp(), { fontSize: 14 }).setDepth(1001);
        this.hudSoundBtn = makeButton(this, GAME_WIDTH - 120, btnY, this.soundLabel(), () => this.toggleSound(), { fontSize: 14 }).setDepth(1001);

        this.add.text(28, LAYOUT.paletteStripH + 14, this.level.hint, Utilities.textStyle({
            fontSize: 15, color: "#7d90b4", align: "left"
        })).setOrigin(0, 0.5).setDepth(1000);
    }

    soundLabel() {
        return Storage.getMuted() ? "SND OFF" : "SND ON";
    }

    toggleSound() {
        const muted = this.sfx.toggleMute();
        this.hudSoundBtn.setText(this.soundLabel());
        if (!muted) this.sfx.click();
    }

    drawPalette() {
        const n = PALETTE.length;
        PALETTE.forEach((key, i) => {
            const x = GAME_WIDTH / 2 + (i - (n - 1) / 2) * 220;
            const atom = new AtomView(this, x, LAYOUT.paletteY, key, {
                palette: true,
                onDown: (a, pointer) => this.spawnCopy(key, pointer)
            });
            atom.setDepth(10);
        });
        this.add.text(GAME_WIDTH / 2, LAYOUT.paletteY + 74, "click an atom to spawn it · drag it into the field", Utilities.textStyle({
            fontSize: 13, color: "#5b6c8c"
        })).setOrigin(0.5).setDepth(9);
    }

    drawTargetPreview() {
        const pos = layoutMolecule(this.level, 58);
        const cx = GAME_WIDTH / 2;
        const art = this.add.graphics().setDepth(1);
        const scale = 0.42;

        // bond lines first
        art.lineStyle(3, COLORS.bond, 0.35);
        this.level.bonds.forEach(([i, j, order]) => {
            const offs = order === 1 ? [0] : order === 2 ? [-5, 5] : [-7, 0, 7];
            const dx = pos[j].x - pos[i].x, dy = pos[j].y - pos[i].y;
            const d = Math.hypot(dx, dy) || 1;
            const px = -dy / d, py = dx / d;
            offs.forEach(off => {
                art.beginPath();
                art.moveTo(cx + pos[i].x + px * off, LAYOUT.previewY + pos[i].y + py * off);
                art.lineTo(cx + pos[j].x + px * off, LAYOUT.previewY + pos[j].y + py * off);
                art.strokePath();
            });
        });
        this.level.atoms.forEach((sym, i) => {
            const e = ELEMENTS[sym];
            art.lineStyle(2, e.color, 0.5);
            art.strokeCircle(cx + pos[i].x, LAYOUT.previewY + pos[i].y, e.rad * scale);
        });
        this.level.atoms.forEach((sym, i) => {
            this.add.text(cx + pos[i].x, LAYOUT.previewY + pos[i].y, sym, Utilities.textStyle({
                fontSize: 14, color: "#9fb4d8"
            })).setOrigin(0.5).setDepth(2);
        });

        this.add.text(cx + 330, LAYOUT.previewY - 18, "TARGET", Utilities.textStyle({
            fontSize: 14, fontStyle: "bold", color: "#5b6c8c"
        })).setOrigin(0, 0.5).setDepth(2);

        // shopping-list chips, updated as the player spawns atoms
        this.chips = {};
        const counts = requiredCounts(this.level);
        const syms = Object.keys(counts);
        syms.forEach((sym, i) => {
            const t = this.add.text(cx + 330, LAYOUT.previewY + 8 + i * 26, "", Utilities.textStyle({
                fontSize: 16, color: "#cfdcee", align: "left"
            })).setOrigin(0, 0.5).setDepth(2);
            this.chips[sym] = t;
        });
        this.updateChips();
    }

    updateChips() {
        const counts = requiredCounts(this.level);
        const have = currentCounts(this.atoms);
        Object.keys(counts).forEach(sym => {
            const got = Math.min(have[sym] || 0, counts[sym]);
            const done = (have[sym] || 0) >= counts[sym];
            if (this.chips[sym]) {
                this.chips[sym].setText(`${sym}  ${got}/${counts[sym]}`);
                this.chips[sym].setColor(done ? "#7dffa8" : "#cfdcee");
            }
        });
    }

    // ----------------------------------------------------------------- logic
    spawnCopy(key, pointer) {
        if (this.paused) return;
        const atom = new AtomView(this, pointer.x, pointer.y, key, { onDown: (a, p) => this.atomDown(a, p) });
        atom.setDepth(50);
        atom.popIn();
        this.atoms.push(atom);
        this.sfx.spawn();
        this.updateChips();
        this.beginDrag(atom, pointer);
        this.drag.fresh = true;   // release of the spawning click must not delete it
        this.drag.moved = false;
    }

    atomDown(atom, pointer) {
        if (this.paused) return;
        this.sfx.resume();
        this.beginDrag(atom, pointer);
    }

    beginDrag(atom, pointer) {
        const comp = componentOf(atom, this.bonds);
        comp.atoms.forEach(a => a.setDepth(60));
        this.drag = { atom, comp, lastX: pointer.x, lastY: pointer.y, startX: pointer.x, startY: pointer.y, moved: false, fresh: false };
    }

    onPointerMove(pointer) {
        if (!this.drag || this.paused) return;
        const dx = pointer.x - this.drag.lastX;
        const dy = pointer.y - this.drag.lastY;
        this.drag.lastX = pointer.x;
        this.drag.lastY = pointer.y;
        if (Math.hypot(pointer.x - this.drag.startX, pointer.y - this.drag.startY) > 8) this.drag.moved = true;
        this.drag.comp.atoms.forEach(a => a.moveBy(dx, dy));
    }

    onPointerUp(pointer) {
        if (!this.drag || this.paused) { this.drag = null; return; }
        const { atom, fresh, moved } = this.drag;
        this.drag = null;
        atom.setDepth(10);

        // A bare click on the palette auto-drops the new atom just below it.
        if (fresh && !moved) {
            atom.moveTo(Utilities.clamp(pointer.x, 60, GAME_WIDTH - 60), LAYOUT.fieldTop + 60);
            this.sfx.drop();
            return;
        }

        // A bare click on a field atom never bonds/breaks anything.
        if (!moved) return;

        // Dropping back on the palette strip deletes the atom (and its bonds).
        if (pointer.y < LAYOUT.paletteStripH - 20) {
            this.removeAtom(atom);
            return;
        }
        this.tryBond(atom);
    }

    tryBond(atom) {
        let partner = null;
        let best = Infinity;
        for (const other of this.atoms) {
            if (other === atom) continue;
            const d = Utilities.distance(atom.x, atom.y, other.x, other.y);
            const reach = (atom.element.rad + other.element.rad) * BOND.grabDistFactor;
            if (d < reach && d < best) { best = d; partner = other; }
        }

        if (!partner) { this.sfx.drop(); return; }

        const bothFree = atom.freeBonds >= 1 && partner.freeBonds >= 1;
        const deny = (msg) => {
            this.sfx.deny();
            atom.shake();
            partner.shake();
            toast(this, msg, GAME_WIDTH / 2, LAYOUT.fieldTop + 40, "#ff9d9d");
        };

        // Dropping onto an atom of the same molecule upgrades the existing
        // bond to a double/triple one (O₂, CO₂, N₂…) when valency allows.
        const own = componentOf(atom, this.bonds);
        if (own.atoms.includes(partner)) {
            const existing = this.bonds.find(b => b.involves(atom) && b.involves(partner));
            if (!existing) { deny("already in this molecule"); return; }
            if (!bothFree) { deny(this.fullMessage(atom, partner)); return; }
            if (existing.order >= 3) { deny("a triple bond is the maximum"); return; }
            existing.addOrder();
            this.sfx.bond();
            const mid = existing.midPoint();
            burst(this, mid.x, mid.y, COLORS.electron, 18, 200);
            ring(this, mid.x, mid.y, COLORS.accent, 70);
            this.checkWin();
            return;
        }

        if (!bothFree) { deny(this.fullMessage(atom, partner)); return; }

        // Snapshot the dragged group BEFORE bonding so the snap tween moves
        // only that group (the partner must stay put).
        const dragComp = componentOf(atom, this.bonds);
        const bond = new BondView(this, atom, partner, 1);
        bond.onClick = (b) => this.breakBond(b);
        this.bonds.push(bond);

        const ideal = (atom.element.rad + partner.element.rad) * BOND.idealFactor;
        const ang = Utilities.angleBetween(partner.x, partner.y, atom.x, atom.y);
        const tx = partner.x + Math.cos(ang) * ideal;
        const ty = partner.y + Math.sin(ang) * ideal;
        const from = dragComp.atoms.map(a => ({ x: a.x, y: a.y }));
        const ax0 = from[dragComp.atoms.indexOf(atom)];
        const dx = tx - ax0.x;
        const dy = ty - ax0.y;
        const state = { t: 0 };
        this.tweens.add({
            targets: state, t: 1, duration: 180, ease: "Cubic.Out",
            onUpdate: () => dragComp.atoms.forEach((a, i) => a.moveTo(from[i].x + dx * state.t, from[i].y + dy * state.t))
        });

        this.sfx.bond();
        const mid = bond.midPoint();
        burst(this, mid.x, mid.y, COLORS.electron, 18, 200);
        ring(this, mid.x, mid.y, COLORS.accent, 70);
        this.checkWin();
    }

    fullMessage(a, b) {
        const full = a.freeBonds < 1 ? a : b;
        return `${full.element.symbol} has no free bond slots`;
    }

    breakBond(bond) {
        if (this.paused || this.won) return;
        const mid = bond.midPoint();
        this.bonds = this.bonds.filter(b => b !== bond);
        bond.destroy();
        this.sfx.break();
        burst(this, mid.x, mid.y, COLORS.bad, 12, 150);
    }

    removeAtom(atom) {
        [...atom.bonds].forEach(b => {
            this.bonds = this.bonds.filter(x => x !== b);
            b.destroy();
        });
        this.atoms = this.atoms.filter(a => a !== atom);
        burst(this, atom.x, atom.y, 0x8899bb, 10, 120);
        atom.destroy();
        this.sfx.delete();
        this.updateChips();
    }

    checkWin() {
        const target = levelSignature(this.level);
        const comps = components(this.atoms, this.bonds);
        for (const comp of comps) {
            if (signature(comp.atoms, comp.bonds) === target) {
                this.win(comp);
                return;
            }
        }
    }

    win(comp) {
        this.won = true;
        this.paused = true;
        const elapsed = (this.time.now - this.startMs) / 1000;
        const n = this.level.atoms.length;
        const stars = elapsed <= n * 5 + 5 ? 3 : elapsed <= n * 10 + 12 ? 2 : 1;

        Storage.recordStars(this.levelIndex, stars);
        Storage.unlockUpTo(this.levelIndex);

        this.sfx.win();
        confetti(this, [COLORS.electron, COLORS.star, COLORS.good, 0xffffff]);
        comp.atoms.forEach((a, i) => {
            this.time.delayedCall(i * 90, () => {
                burst(this, a.x, a.y, a.element.color, 22, 240);
                ring(this, a.x, a.y, COLORS.star, a.element.rad + 40);
            });
        });

        this.time.delayedCall(1100, () => this.showWinPanel(stars));
    }

    showWinPanel(stars) {
        dim(this, 0.7, 1800);
        const cx = GAME_WIDTH / 2;
        const panel = this.add.graphics().setDepth(1900);
        const pw = 620, ph = 330;
        panel.fillStyle(0x101826, 0.98);
        panel.lineStyle(2, COLORS.star, 0.8);
        panel.fillRoundedRect(cx - pw / 2, 190, pw, ph, 18);
        panel.strokeRoundedRect(cx - pw / 2, 190, pw, ph, 18);

        const heading = this.add.text(cx, 240, "MOLECULE COMPLETE!", Utilities.textStyle({
            fontSize: 36, fontStyle: "bold", color: "#ffd75e"
        })).setOrigin(0.5).setDepth(1901).setAlpha(0);
        this.tweens.add({ targets: heading, alpha: 1, scale: { from: 0.7 }, duration: 350, ease: "Back.Out" });

        this.add.text(cx, 292, `${this.level.name} · ${this.level.formula}`, Utilities.textStyle({
            fontSize: 20, color: "#cfdcee"
        })).setOrigin(0.5).setDepth(1901);

        for (let i = 0; i < 3; i++) {
            const earned = i < stars;
            const star = this.add.text(cx - 70 + i * 70, 350, earned ? "★" : "☆", Utilities.textStyle({
                fontSize: 52, color: earned ? "#ffd75e" : "#3c4a63"
            })).setOrigin(0.5).setDepth(1901).setScale(0.01);
            this.tweens.add({
                targets: star, scale: 1, duration: 300, delay: 400 + i * 260, ease: "Back.Out",
                onStart: () => { if (earned) this.sfx.star(i); }
            });
        }

        const isLast = this.levelIndex + 1 >= LEVELS.length;
        makeButton(this, cx - 170, 455, isLast ? "FINISH" : "NEXT LEVEL", () => {
            this.sfx.click();
            if (isLast) this.toMenu();
            else this.scene.restart({ level: this.levelIndex + 1 });
        }, { fontSize: 18 }).setDepth(1902);
        makeButton(this, cx + 10, 455, "REPLAY", () => { this.sfx.click(); this.restart(); }, { fontSize: 18 }).setDepth(1902);
        makeButton(this, cx + 180, 455, "MENU", () => this.toMenu(), { fontSize: 18 }).setDepth(1902);
    }

    // ------------------------------------------------------------ navigation
    restart() {
        this.sfx.click();
        this.scene.restart({ level: this.levelIndex });
    }

    toMenu() {
        this.sfx.click();
        this.cameras.main.fadeOut(300, 11, 14, 23);
        this.time.delayedCall(330, () => this.scene.start(SceneKeys.Menu));
    }

    openHelp() {
        if (this.paused) return;
        this.paused = true;
        this.sfx.click();
        this.scene.launch(SceneKeys.Help, { onClose: () => { this.paused = false; } });
    }

    update() {
        for (const bond of this.bonds) bond.refresh();
    }
}

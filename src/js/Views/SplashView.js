import Phaser from "phaser";
import { SceneKeys, GAME_WIDTH, GAME_HEIGHT, COLORS, ELEMENTS } from "../Constants";
import { Utilities } from "../Utilities";
import { Sfx } from "../Sfx";
import { ensureTextures } from "../UI/Particles";
import { starfield as backdrop } from "../UI/Widgets";

// Animated title screen: a stylised water molecule with orbiting electrons,
// click (or a few seconds) to continue.
export class SplashView extends Phaser.Scene {
    constructor() {
        super({ key: SceneKeys.Splash });
    }

    create() {
        this.sfx = new Sfx(this);
        ensureTextures(this);
        backdrop(this);

        const cx = GAME_WIDTH / 2;
        const cy = GAME_HEIGHT / 2 - 40;

        // --- molecule logo -------------------------------------------------
        const art = this.add.graphics();
        const oR = ELEMENTS.O.rad;
        const hR = ELEMENTS.H.rad;
        const hL = { x: cx - 110, y: cy + 78 };
        const hRt = { x: cx + 110, y: cy + 78 };

        const electrons = [];
        for (let i = 0; i < 4; i++) electrons.push({ a: (Math.PI / 2) * i, speed: 1.2 + i * 0.13, r: oR + 26 });

        this.logoState = { t: 0 };
        this.logoDraw = () => {
            art.clear();
            // bonds
            art.lineStyle(5, COLORS.bond, 0.9);
            art.beginPath(); art.moveTo(hL.x, hL.y); art.lineTo(cx, cy); art.strokePath();
            art.beginPath(); art.moveTo(hRt.x, hRt.y); art.lineTo(cx, cy); art.strokePath();
            // shells
            art.lineStyle(2.5, ELEMENTS.O.color, 1); art.strokeCircle(cx, cy, oR);
            art.lineStyle(2.5, ELEMENTS.H.color, 1);
            art.strokeCircle(hL.x, hL.y, hR); art.strokeCircle(hRt.x, hRt.y, hR);
            // nuclei
            art.fillStyle(ELEMENTS.O.dark, 1); art.fillCircle(cx, cy, oR * 0.52);
            art.fillStyle(ELEMENTS.H.dark, 1); art.fillCircle(hL.x, hL.y, hR * 0.52); art.fillCircle(hRt.x, hRt.y, hR * 0.52);
            // orbiting electrons
            electrons.forEach((e, i) => {
                const a = e.a + this.logoState.t * e.speed;
                art.fillStyle(COLORS.electron, 1);
                art.fillCircle(cx + Math.cos(a) * e.r, cy + Math.sin(a) * e.r * 0.55, 5);
                if (i % 2) art.fillCircle(cx - Math.cos(a) * e.r, cy - Math.sin(a) * e.r * 0.55, 5);
            });
        };

        const symbolO = this.add.text(cx, cy, "O", Utilities.textStyle({ fontSize: 40, fontStyle: "bold" })).setOrigin(0.5);
        const symbolL = this.add.text(hL.x, hL.y, "H", Utilities.textStyle({ fontSize: 28, fontStyle: "bold" })).setOrigin(0.5);
        const symbolR = this.add.text(hRt.x, hRt.y, "H", Utilities.textStyle({ fontSize: 28, fontStyle: "bold" })).setOrigin(0.5);

        const title = this.add.text(cx, cy - 190, "COVALENT BONDING", Utilities.textStyle({
            fontSize: 56, fontStyle: "bold", color: "#eaf3ff"
        })).setOrigin(0.5).setAlpha(0).setY(cy - 215);
        const sub = this.add.text(cx, cy + 190, "a chemistry puzzle game", Utilities.textStyle({
            fontSize: 22, color: "#9fb4d8"
        })).setOrigin(0.5).setAlpha(0);
        const tap = this.add.text(cx, GAME_HEIGHT - 70, "CLICK  TO  START", Utilities.textStyle({
            fontSize: 20, color: "#53d8e8", fontStyle: "bold"
        })).setOrigin(0.5).setAlpha(0);

        // entrance tweens
        const parts = [art, symbolO, symbolL, symbolR];
        parts.forEach(p => { p.setAlpha(0); });
        this.tweens.add({ targets: parts, alpha: 1, scale: { from: 0.6, to: 1 }, duration: 700, ease: "Back.Out" });
        this.tweens.add({ targets: title, alpha: 1, y: cy - 190, duration: 600, delay: 250, ease: "Cubic.Out" });
        this.tweens.add({ targets: sub, alpha: 1, duration: 600, delay: 500 });
        this.tweens.add({ targets: tap, alpha: 1, duration: 400, delay: 900 });
        this.tweens.add({ targets: tap, alpha: 0.35, duration: 700, delay: 1400, yoyo: true, repeat: -1 });

        // logo idle bob + electron orbit
        this.tweens.add({ targets: [symbolO, symbolL, symbolR], y: "+=6", duration: 1400, yoyo: true, repeat: -1, ease: "Sine.InOut" });

        this.leaving = false;
        const go = () => {
            if (this.leaving) return;
            this.leaving = true;
            this.sfx.click();
            this.cameras.main.fadeOut(450, 11, 14, 23);
            this.time.delayedCall(480, () => this.scene.start(SceneKeys.Menu));
        };
        this.input.once("pointerdown", go);
        this.input.keyboard.once("keydown", go);
        this.time.delayedCall(5000, go);
    }

    update(time, delta) {
        this.logoState.t += delta / 1000;
        this.logoDraw();
    }
}

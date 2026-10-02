import Phaser from "phaser";
import { SceneKeys, GAME_WIDTH, GAME_HEIGHT, COLORS, ELEMENTS } from "../Constants";
import { Utilities } from "../Utilities";
import { Sfx } from "../Sfx";
import { dim, makeButton } from "../UI/Widgets";
import { AtomView } from "../GameObjects/AtomView";
import { BondView } from "../GameObjects/BondView";

// Modal overlay explaining the rules. Launched on top of Menu or GamePlay;
// `data.onClose` (if given) runs when it closes, e.g. to unpause the game.
export class HelpView extends Phaser.Scene {
    constructor() {
        super({ key: SceneKeys.Help });
    }

    init(data) {
        this.onClose = (data && data.onClose) || null;
    }

    create() {
        this.sfx = new Sfx(this);
        dim(this, 0.82, 2000);

        const cx = GAME_WIDTH / 2;
        const panel = this.add.graphics().setDepth(2001);
        const pw = 900, ph = 560;
        panel.fillStyle(0x101826, 0.98);
        panel.lineStyle(2, 0x33415c, 1);
        panel.fillRoundedRect(cx - pw / 2, 70, pw, ph, 18);
        panel.strokeRoundedRect(cx - pw / 2, 70, pw, ph, 18);

        this.add.text(cx, 116, "HOW TO PLAY", Utilities.textStyle({
            fontSize: 34, fontStyle: "bold", color: "#eaf3ff"
        })).setOrigin(0.5).setDepth(2002);

        const lines = [
            ["1.", "Click an atom in the top palette to spawn a copy, then drag it into the field."],
            ["2.", "Drop one atom ONTO another: they share an electron pair and form a bond."],
            ["3.", "Drop again on the same partner for double / triple bonds (O₂, N₂, CO₂…)."],
            ["4.", "Cyan dots on a shell are free bond slots — H:1 · O:2 · N:3 · C:4."],
            ["5.", "Click a bond to break it. Drop an atom back on the top strip to delete it."],
            ["6.", "Rebuild the target molecule shown at the bottom of the screen to win."],
            ["",  "Keys: R restart · H help · M mute · Esc menu"]
        ];
        lines.forEach(([n, text], i) => {
            const y = 176 + i * 52;
            this.add.text(cx - pw / 2 + 60, y, n, Utilities.textStyle({
                fontSize: 20, fontStyle: "bold", color: "#53d8e8"
            })).setOrigin(0, 0.5).setDepth(2002);
            this.add.text(cx - pw / 2 + 100, y, text, Utilities.textStyle({
                fontSize: 18, color: "#cfdcee", align: "left"
            })).setOrigin(0, 0.5).setDepth(2002);
        });

        // live mini-demo: H–H bond with shared electrons, right of the keys row
        const demoY = 176 + 6 * 52;
        const a = new AtomView(this, cx + 250, demoY, "H", {});
        const b = new AtomView(this, cx + 370, demoY, "H", {});
        a.setDepth(2002); b.setDepth(2002);
        const bond = new BondView(this, a, b, 1);
        bond.graphics.setDepth(2002);
        bond.setInteractiveActive(false);
        bond.badgeBg.setDepth(2002);
        bond.badgeX.setDepth(2002);
        const demo = { t: 0 };
        this.tweens.add({
            targets: demo, t: Math.PI * 2, duration: 2000, repeat: -1, ease: "Sine.InOut",
            onUpdate: () => {
                const off = Math.sin(demo.t) * 14;
                a.moveTo(cx + 250 + off, demoY);
                b.moveTo(cx + 370 - off, demoY);
                bond.refresh();
            }
        });

        makeButton(this, cx, 70 + ph - 34, "GOT IT", () => {
            this.sfx.click();
            this.close();
        }, { fontSize: 20 }).setDepth(2003);

        // clicking the dim area also closes
        this.input.once("pointerdown", (p) => {
            const within = p.x > cx - pw / 2 && p.x < cx + pw / 2 && p.y > 70 && p.y < 70 + ph;
            if (!within) this.close();
        });
    }

    close() {
        if (this.closed) return;
        this.closed = true;
        if (this.onClose) this.onClose();
        this.scene.stop();
    }
}

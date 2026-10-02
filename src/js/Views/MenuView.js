import Phaser from "phaser";
import { SceneKeys, GAME_WIDTH, GAME_HEIGHT, COLORS } from "../Constants";
import { Utilities } from "../Utilities";
import { LEVELS } from "../Levels";
import { Storage } from "../Storage";
import { Sfx } from "../Sfx";
import { ensureTextures } from "../UI/Particles";
import { makeButton, starfield } from "../UI/Widgets";

// Title + level select. Locked levels unlock in order; best stars persist.
export class MenuView extends Phaser.Scene {
    constructor() {
        super({ key: SceneKeys.Menu });
    }

    create() {
        this.sfx = new Sfx(this);
        ensureTextures(this);
        starfield(this);
        this.cameras.main.fadeIn(400, 11, 14, 23);

        const cx = GAME_WIDTH / 2;

        const title = this.add.text(cx, 96, "COVALENT BONDING", Utilities.textStyle({
            fontSize: 52, fontStyle: "bold", color: "#eaf3ff"
        })).setOrigin(0.5);
        const subtitle = this.add.text(cx, 142, "build molecules · share electrons", Utilities.textStyle({
            fontSize: 18, color: "#9fb4d8"
        })).setOrigin(0.5);
        this.tweens.add({ targets: title, alpha: { from: 0 }, y: { from: 82, to: 96 }, duration: 500, ease: "Cubic.Out" });
        this.tweens.add({ targets: subtitle, alpha: { from: 0 }, y: { from: 128, to: 142 }, duration: 500, delay: 90, ease: "Cubic.Out" });

        const stars = this.add.text(GAME_WIDTH - 28, 34, `★ ${Storage.totalStars()} / ${LEVELS.length * 3}`, Utilities.textStyle({
            fontSize: 20, color: "#ffd75e", fontStyle: "bold"
        })).setOrigin(1, 0.5);

        // --- level grid ----------------------------------------------------
        const unlocked = Storage.getUnlocked();
        const cols = 5;
        const bw = 196, bh = 108, gap = 22;
        const gridW = cols * bw + (cols - 1) * gap;
        const startX = cx - gridW / 2 + bw / 2;
        const startY = 250;

        LEVELS.forEach((level, i) => {
            const col = i % cols;
            const row = Math.floor(i / cols);
            const x = startX + col * (bw + gap);
            const y = startY + row * (bh + gap);
            this.levelButton(level, i, x, y, bw, bh, i <= unlocked);
        });

        // --- footer buttons -------------------------------------------------
        const soundBtn = makeButton(this, cx - 190, GAME_HEIGHT - 84, this.soundLabel(), () => {
            const muted = this.sfx.toggleMute();
            soundBtn.setText(this.soundLabel());
            if (!muted) this.sfx.click();
        });
        makeButton(this, cx, GAME_HEIGHT - 84, "HOW TO PLAY", () => {
            this.sfx.click();
            this.scene.launch(SceneKeys.Help);
        });
        makeButton(this, cx + 190, GAME_HEIGHT - 84, "FULLSCREEN", () => {
            this.sfx.click();
            try { this.scale.toggleFullscreen(); } catch (e) { /* unsupported */ }
        });

        this.add.text(cx, GAME_HEIGHT - 30, "Chemistry Game by Ketan Dutt · built with Phaser 3", Utilities.textStyle({
            fontSize: 13, color: "#5b6c8c"
        })).setOrigin(0.5);
    }

    soundLabel() {
        return Storage.getMuted() ? "SOUND: OFF" : "SOUND: ON";
    }

    levelButton(level, index, x, y, w, h, unlocked) {
        const best = Storage.getStars(index);
        const bg = this.add.graphics();
        const draw = (hover) => {
            bg.clear();
            bg.fillStyle(hover && unlocked ? 0x1d2c45 : 0x141c2b, 0.95);
            bg.lineStyle(2, unlocked ? (hover ? COLORS.accent : 0x33415c) : 0x222b3c, 1);
            bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 14);
            bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 14);
        };
        draw(false);

        const formula = this.add.text(x, y - 16, level.formula, Utilities.textStyle({
            fontSize: 30, fontStyle: "bold", color: unlocked ? "#ffffff" : "#4b5a75"
        })).setOrigin(0.5);
        const name = this.add.text(x, y + 18, unlocked ? level.name : "LOCKED", Utilities.textStyle({
            fontSize: 14, color: unlocked ? "#9fb4d8" : "#3c4a63"
        })).setOrigin(0.5);
        const starTxt = this.add.text(x, y + 40, "★".repeat(best) + "☆".repeat(3 - best), Utilities.textStyle({
            fontSize: 14, color: best ? "#ffd75e" : "#3c4a63"
        })).setOrigin(0.5);

        const hit = this.add.rectangle(x, y, w, h, 0x000000, 0).setInteractive({ useHandCursor: unlocked });
        hit.on("pointerover", () => { if (unlocked) { draw(true); this.sfx.hover(); } });
        hit.on("pointerout", () => draw(false));
        hit.on("pointerdown", () => {
            if (!unlocked) { this.sfx.deny(); this.tweens.add({ targets: [formula, name], x: "-=5", duration: 50, yoyo: true, repeat: 3 }); return; }
            this.sfx.click();
            this.cameras.main.fadeOut(300, 11, 14, 23);
            this.time.delayedCall(330, () => this.scene.start(SceneKeys.Game, { level: index }));
        });

        // entrance
        this.tweens.add({ targets: [bg, formula, name, starTxt, hit], alpha: { from: 0 }, duration: 350, delay: index * 50 });
    }
}

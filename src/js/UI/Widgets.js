import Phaser from "phaser";
import { Utilities } from "../Utilities";
import { COLORS } from "../Constants";

// Rounded-rectangle UI button with hover/press tweens. Returns an object with
// setText() and destroy(). All hit-testing goes through the text object.
export function makeButton(scene, x, y, label, onClick, opts = {}) {
    const fontSize = opts.fontSize || 18;
    const pad = opts.padX || 14;

    const bg = scene.add.graphics();
    const text = scene.add.text(x, y, label, Utilities.textStyle({
        fontSize,
        color: opts.color || "#dfe8ff",
        fontStyle: "bold"
    })).setOrigin(0.5).setPadding(pad, pad * 0.6);

    const draw = (hover) => {
        const w = text.width + 4;
        const h = text.height + 4;
        bg.clear();
        bg.fillStyle(hover ? (opts.hoverBg || 0x27405c) : (opts.bg || 0x1a2436), 0.95);
        bg.lineStyle(1.5, hover ? COLORS.accent : 0x3a4a66, 1);
        bg.fillRoundedRect(x - w / 2, y - h / 2, w, h, 10);
        bg.strokeRoundedRect(x - w / 2, y - h / 2, w, h, 10);
    };
    draw(false);

    text.setInteractive({ useHandCursor: true })
        .on("pointerover", () => { draw(true); scene.tweens.add({ targets: text, scale: 1.06, duration: 90 }); if (opts.onHover) opts.onHover(); })
        .on("pointerout", () => { draw(false); scene.tweens.add({ targets: text, scale: 1, duration: 90 }); })
        .on("pointerdown", () => scene.tweens.add({ targets: text, scale: 0.94, duration: 60, yoyo: true }))
        .on("pointerup", () => onClick && onClick());

    return {
        text,
        bg,
        setText(next) {
            text.setText(next);
            draw(false);
        },
        setPosition(nx, ny) {
            x = nx; y = ny;
            text.setPosition(x, y);
            draw(false);
        },
        setDepth(d) { text.setDepth(d); bg.setDepth(d - 1); return this; },
        setAlpha(a) { text.setAlpha(a); bg.setAlpha(a); return this; },
        destroy() { text.destroy(); bg.destroy(); }
    };
}

// Fade-in/out toast message centred at (x, y).
export function toast(scene, message, x, y, color = "#ffffff") {
    const t = scene.add.text(x, y, message, Utilities.textStyle({
        fontSize: 22,
        color,
        fontStyle: "bold",
        backgroundColor: "rgba(10,14,23,0.75)",
        padding: { x: 14, y: 8 }
    })).setOrigin(0.5).setDepth(1500).setAlpha(0);

    scene.tweens.add({ targets: t, alpha: 1, y: y - 12, duration: 180, ease: "Cubic.Out" });
    scene.tweens.add({
        targets: t, alpha: 0, y: y - 34, duration: 320, delay: 1400,
        onComplete: () => t.destroy()
    });
    return t;
}

// Dark full-screen panel used behind overlays (win screen, help).
export function dim(scene, alpha = 0.72, depth = 900) {
    return scene.add.rectangle(
        scene.scale.width / 2, scene.scale.height / 2,
        scene.scale.width, scene.scale.height, 0x000000, alpha
    ).setDepth(depth);
}

// Draw a decorative starfield backdrop (cheap static dots + slow twinkle).
export function starfield(scene) {
    const g = scene.add.graphics().setDepth(-10);
    for (let i = 0; i < 90; i++) {
        const x = Phaser.Math.Between(0, scene.scale.width);
        const y = Phaser.Math.Between(0, scene.scale.height);
        const r = Phaser.Math.FloatBetween(0.5, 1.6);
        g.fillStyle(0x9fb4d8, Phaser.Math.FloatBetween(0.08, 0.35));
        g.fillCircle(x, y, r);
    }
    scene.tweens.add({ targets: g, alpha: 0.55, duration: 2400, yoyo: true, repeat: -1, ease: "Sine.InOut" });
    return g;
}

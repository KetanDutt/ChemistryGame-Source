// Shared VFX helpers: generated particle textures + one-shot bursts, ring
// flashes and a win-time confetti rain. Uses the Phaser 3.60+ particle API
// (`scene.add.particles(x, y, texture, config)` returns an emitter).
// Textures live in the game-wide TextureManager, so generating them once
// (guarded by `exists`) is enough for every scene.

export function ensureTextures(scene) {
    if (!scene.textures.exists("p-dot")) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillCircle(8, 8, 8);
        g.generateTexture("p-dot", 16, 16);
        g.destroy();
    }
    if (!scene.textures.exists("p-spark")) {
        const g = scene.make.graphics({ x: 0, y: 0, add: false });
        g.fillStyle(0xffffff, 1);
        g.fillRect(6, 0, 4, 16);
        g.generateTexture("p-spark", 16, 16);
        g.destroy();
    }
}

// Radial additive burst at (x, y).
export function burst(scene, x, y, color, count = 16, speed = 220) {
    const emitter = scene.add.particles(x, y, "p-dot", {
        speed: { min: 40, max: speed },
        angle: { min: 0, max: 360 },
        scale: { start: 0.7, end: 0 },
        alpha: { start: 1, end: 0 },
        lifespan: { min: 300, max: 650 },
        tint: [color],
        blendMode: "ADD",
        emitting: false
    });
    emitter.explode(count, x, y);
    scene.time.delayedCall(1000, () => emitter.destroy());
    return emitter;
}

// Expanding ring flash, drawn with a tweened Graphics circle.
export function ring(scene, x, y, color, maxRadius = 90) {
    const g = scene.add.graphics();
    const state = { r: 8, alpha: 0.9 };
    scene.tweens.add({
        targets: state,
        r: maxRadius,
        alpha: 0,
        duration: 420,
        ease: "Cubic.Out",
        onUpdate: () => {
            g.clear();
            g.lineStyle(3, color, state.alpha);
            g.strokeCircle(x, y, state.r);
        },
        onComplete: () => g.destroy()
    });
}

// Celebratory confetti rain from the top of the screen.
export function confetti(scene, colors) {
    const emitter = scene.add.particles(0, -20, "p-spark", {
        x: { min: 0, max: scene.scale.width },
        speedY: { min: 120, max: 320 },
        speedX: { min: -60, max: 60 },
        angle: { min: 0, max: 360 },
        angularVelocity: { min: -300, max: 300 },
        scale: { start: 0.8, end: 0.3 },
        lifespan: { min: 1400, max: 2200 },
        tint: colors,
        blendMode: "ADD",
        frequency: 30
    });
    scene.time.delayedCall(1600, () => emitter.stop());
    scene.time.delayedCall(3800, () => emitter.destroy());
    return emitter;
}

import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, COLORS, SceneKeys } from "./js/Constants";
import { SplashView } from "./js/Views/SplashView";
import { MenuView } from "./js/Views/MenuView";
import { HelpView } from "./js/Views/HelpView";
import { GamePlayView } from "./js/Views/GamePlayView";

// Fixed logical resolution + FIT scaling keeps the layout correct on any
// screen size without manual resize handling.
const game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: "#" + COLORS.bg.toString(16).padStart(6, "0"),
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    scene: [SplashView, MenuView, GamePlayView, HelpView],
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH
    },
    input: {
        keyboard: true,
        mouse: true,
        touch: true
    }
});

// Debug/test hook (used by the headless E2E suite).
window.__GAME__ = game;

// Hide the static loading splash from index.html once the canvas is live.
game.events.once(Phaser.Core.Events.READY, () => {
    const el = document.getElementById("loading");
    if (el) el.remove();
});

export default game;

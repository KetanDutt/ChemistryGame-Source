import Phaser from 'phaser';
import { SplashView } from "./js/Views/SplashView";
import { MenuView } from "./js/Views/MenuView";
import { GamePlayView } from "./js/Views/GamePlayView";

var game = new Phaser.Game({
    type: Phaser.AUTO,
    backgroundColor: 0x000000,
    scene: [SplashView, MenuView, GamePlayView],
    scale: {
        mode: Phaser.Scale.ScaleModes.RESIZE,
        autoCenter: Phaser.Scale.Center.CENTER_BOTH
    }
});
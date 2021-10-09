import { Constants } from "../Constants"
import { Utilities } from "../Utilities";

export class SplashView extends Phaser.Scene {
    constructor() {
        super({ key: Constants.SplashView })
    }

    create() {
        let screenWidth = this.game.scale.width
        let screenHeight = this.game.scale.height

        this.input.on('pointerup', () => Utilities.fullScreen(this));
        this.input.keyboard.on('keyup', () => Utilities.fullScreen(this));
        this.game.scale.on('resize', resize, this);

        this.add.circle(screenWidth / 2, screenHeight / 2, 80).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2, screenHeight / 2, 'O', Utilities.textStyle).setOrigin(0.5)

        this.add.circle(screenWidth / 2 - 60, screenHeight / 2 + 25, 2, 0xff00ff).setStrokeStyle(1, 0xff00ff);
        this.add.circle(screenWidth / 2 - 45, screenHeight / 2 + 45, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 - 80, screenHeight / 2 + 50, 50).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2 - 80, screenHeight / 2 + 50, 'H', Utilities.textStyle).setOrigin(0.5)

        this.add.circle(screenWidth / 2 + 60, screenHeight / 2 + 25, 2, 0xff00ff).setStrokeStyle(1, 0xff00ff);
        this.add.circle(screenWidth / 2 + 40, screenHeight / 2 + 45, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 + 80, screenHeight / 2 + 50, 50).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2 + 80, screenHeight / 2 + 50, 'H', Utilities.textStyle).setOrigin(0.5)

        this.add.circle(screenWidth / 2 - 60, screenHeight / 2 - 25, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 - 40, screenHeight / 2 - 45, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 + 60, screenHeight / 2 - 25, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 + 40, screenHeight / 2 - 45, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);

        this.add.text(screenWidth / 2, screenHeight * .8, 'Chemistry Game by Ketan Dutt', Utilities.textStyle).setOrigin(0.5)

        this.time.delayedCall(3000, () => {
            this.scene.start(Constants.MenuView)
        });
    }
}

function resize(gameSize, baseSize, displaySize, resolution) {
    //TODO move objects according to gameSize
    // this.scene.start(Constants.MenuView)
}
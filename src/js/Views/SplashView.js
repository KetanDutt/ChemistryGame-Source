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

        let textStyle = {
            fontFamily: 'Verdana, Arial, Helvetica, sans-serif',
            fontSize: 20,
            color: '#ffffff'
        }

        this.add.circle(screenWidth / 2, screenHeight / 2, 80).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2, screenHeight / 2, 'O', textStyle).setOrigin(0.5)

        this.add.circle(screenWidth / 2 - 65, screenHeight / 2, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 - 100, screenHeight / 2, 50).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2 - 100, screenHeight / 2, 'H', textStyle).setOrigin(0.5)

        this.add.circle(screenWidth / 2 + 65, screenHeight / 2, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 + 100, screenHeight / 2, 50).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2 + 100, screenHeight / 2, 'H', textStyle).setOrigin(0.5)

        this.add.text(screenWidth / 2, screenHeight * .8, 'Chemistry Game by Ketan Dutt', textStyle).setOrigin(0.5)

        this.time.delayedCall(4000, () => {
            this.scene.start(Constants.MenuView)
        });
    }
}

function resize(gameSize, baseSize, displaySize, resolution) {
    console.log(gameSize)
    var width = gameSize.width;
    var height = gameSize.height;

    this.cameras.resize(width, height);

    // this.logo.setPosition(width / 2, height / 2);
}
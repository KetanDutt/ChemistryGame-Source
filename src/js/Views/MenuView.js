import { Constants } from "../Constants"
import { Utilities } from "../Utilities";

let playButton;

export class MenuView extends Phaser.Scene {
    constructor() {
        super({ key: Constants.MenuView })
    }

    init() {}

    preload() {}

    create() {
        let screenWidth = this.game.scale.width
        let screenHeight = this.game.scale.height

        this.input.on('pointerup', () => Utilities.fullScreen(this));
        this.input.keyboard.on('keyup', () => Utilities.fullScreen(this));
        this.game.scale.on('resize', resize, this);

        let textStyle = {
            fontFamily: 'Verdana, Arial, Helvetica, sans-serif',
            fontSize: 20,
            color: '#ffffff',
            align: 'center',
        }

        this.add.circle(screenWidth / 2, screenHeight / 2, 80).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2, screenHeight / 2, 'O', textStyle).setOrigin(0.5)

        this.add.circle(screenWidth / 2 - 65, screenHeight / 2, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 - 100, screenHeight / 2, 50).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2 - 100, screenHeight / 2, 'H', textStyle).setOrigin(0.5)

        this.add.circle(screenWidth / 2 + 65, screenHeight / 2, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff);
        this.add.circle(screenWidth / 2 + 100, screenHeight / 2, 50).setStrokeStyle(1, 0xffffff);
        this.add.text(screenWidth / 2 + 100, screenHeight / 2, 'H', textStyle).setOrigin(0.5)

        this.add.text(screenWidth / 2, screenHeight / 2 + 120, 'Covalent Bonding', textStyle).setOrigin(0.5)

        textStyle.fontSize = 30
        playButton = this.add.text(screenWidth / 2, screenHeight * .8, 'PLAY', textStyle)
            .setOrigin(0.5)
            .setPadding(20)
            .setInteractive({ useHandCursor: true })
            .setStyle({ backgroundColor: '#111' })
            .on('pointerdown', () => this.scene.start(Constants.SplashView))
            .on('pointerover', () => playButton.setStyle({ fill: '#f39c12' }))
            .on('pointerout', () => playButton.setStyle({ fill: '#FFF' }));
    }

    update() {}
}

function resize(gameSize, baseSize, displaySize, resolution) {
    console.log(gameSize)
    var width = gameSize.width;
    var height = gameSize.height;

    this.cameras.resize(width, height);

    // this.logo.setPosition(width / 2, height / 2);
}
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

        this.add.text(screenWidth / 2, screenHeight / 2 + 150, 'Covalent Bonding', Utilities.textStyle).setOrigin(0.5)

        let textStyle = Utilities.textStyle
        textStyle.fontSize = 30
        playButton = this.add.text(screenWidth / 2, screenHeight * .8, 'PLAY', textStyle)
            .setOrigin(0.5)
            .setPadding(20)
            .setInteractive({ useHandCursor: true })
            .setStyle({ backgroundColor: '#111' })
            .on('pointerdown', () => this.scene.start(Constants.GamePlayView))
            .on('pointerover', () => playButton.setStyle({ fill: '#f39c12' }))
            .on('pointerout', () => playButton.setStyle({ fill: '#FFF' }));
    }

    update() {}
}

function resize(gameSize, baseSize, displaySize, resolution) {
    //TODO move objects according to gameSize
    // this.scene.start(Constants.MenuView)
}
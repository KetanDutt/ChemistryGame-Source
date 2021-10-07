import { Constants } from "../Constants"
import { Utilities } from "../Utilities";

export class GamePlayView extends Phaser.Scene {
    constructor() {
        super({ key: Constants.GamePlayView })
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
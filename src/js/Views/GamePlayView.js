import { Constants } from "../Constants"
import { Utilities } from "../Utilities";
import { Atom } from "../GameObjects/Atom";
import { Bond } from "../GameObjects/Bond";
import { Molecule } from "../GameObjects/Molecule";

let Atoms = []
let Bonds = []
let Molecules = []
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

        Atoms.push(new Atom(this, (screenWidth / 7) * 1, screenHeight * .15, Constants.Atoms.Hydrogen))
        Atoms.push(new Atom(this, (screenWidth / 7) * 2, screenHeight * .15, Constants.Atoms.Oxygen))
        Atoms.push(new Atom(this, (screenWidth / 7) * 3, screenHeight * .15, Constants.Atoms.Hydrogen))
        Atoms.push(new Atom(this, (screenWidth / 7) * 4, screenHeight * .15, Constants.Atoms.Carbon))
        Atoms.push(new Atom(this, (screenWidth / 7) * 5, screenHeight * .15, Constants.Atoms.Oxygen))
        Atoms.push(new Atom(this, (screenWidth / 7) * 6, screenHeight * .15, Constants.Atoms.Oxygen))

        Molecules.push(new Molecule(this, (screenWidth / 4) * 1, screenHeight * .85, [{ x: -40, y: 0, rad: 50 }, { x: 40, y: 0, rad: 50 }]))
        Molecules.push(new Molecule(this, (screenWidth / 4) * 2, screenHeight * .85, [{ x: -30, y: 30, rad: 50 }, { x: 30, y: 30, rad: 50 }, { x: 0, y: -30, rad: 50 }]))
        Molecules.push(new Molecule(this, (screenWidth / 4) * 3, screenHeight * .85, [{ x: 0, y: 0, rad: 50 }, { x: 70, y: 0, rad: 50 }, { x: -50, y: -55, rad: 50 }, { x: -50, y: 55, rad: 50 }]))

        this.input.on('pointerdown', function(pointer) {
            let AtomClicked
            Atoms.forEach(atom => {
                atom.electrons.forEach(electron => {
                    if (Phaser.Math.Distance.Between(electron.obj.x, electron.obj.y, pointer.x, pointer.y) < 20) {
                        AtomClicked = atom
                    }
                });
            });
        });
        // this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
        //     let draggingAtom
        //     Atoms.forEach(atom => {
        //         if (atom.x === gameObject.x && atom.y === gameObject.y) {
        //             draggingAtom = atom
        //         }
        //     });
        //     checkBondFormation(draggingAtom)
        //     dragBonds(draggingAtom, dragX, dragY)
        // });
    }

    update() {}
}

function dragBonds(draggingAtom, dragX, dragY) {
    draggingAtom.bonds.forEach(bond => {
        bond.atom1.move(dragX, dragY)
        bond.atom2.move(dragX, dragY)
    })
}

function checkBondFormation(draggingAtom) {
    let collidingAtom
    if (draggingAtom) {
        Atoms.forEach(atom => {
            if (atom.x != draggingAtom.x && atom.y !== draggingAtom.y) {
                if (Phaser.Math.Distance.Between(atom.x, atom.y, draggingAtom.x, draggingAtom.y) < atom.type.rad + draggingAtom.type.rad) {
                    collidingAtom = atom
                }
            }
        });

        if (collidingAtom) {
            if (collidingAtom.valency > 0 && draggingAtom.valency > 0) {
                Bonds.push(new Bond(this, draggingAtom, collidingAtom))
                console.log(Bonds)
            }
        }
    }
}

function resize(gameSize, baseSize, displaySize, resolution) {
    //TODO move objects according to gameSize
}
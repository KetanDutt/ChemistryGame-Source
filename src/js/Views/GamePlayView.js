import { Constants } from "../Constants"
import { Utilities } from "../Utilities";
import { Atom } from "../GameObjects/Atom";
import { Bond } from "../GameObjects/Bond";
import { Molecule } from "../GameObjects/Molecule";

export class GamePlayView extends Phaser.Scene {
    constructor() {
        super({ key: Constants.GamePlayView })
    }

    init() {}

    preload() {}

    create() {
        this.Atoms = []
        this.Bonds = []
        this.Molecules = []

        let screenWidth = this.game.scale.width
        let screenHeight = this.game.scale.height

        this.input.on('pointerup', () => Utilities.fullScreen(this));
        this.input.keyboard.on('keyup', () => Utilities.fullScreen(this));
        this.game.scale.on('resize', resize, this);

        this.add.rectangle(screenWidth / 2, screenHeight / 2, screenWidth, screenHeight, 0x222222);
        this.add.rectangle(screenWidth / 2, screenHeight * .1, screenWidth, screenHeight * .2, 0x111111);
        this.add.rectangle(screenWidth / 2, screenHeight * .85, screenWidth, screenHeight * .3, 0x111111);

        this.Atoms.push(new Atom(this, (screenWidth / 5) * 1, screenHeight * .1, Constants.Atoms.Hydrogen, true))
        this.Atoms.push(new Atom(this, (screenWidth / 5) * 2, screenHeight * .1, Constants.Atoms.Oxygen, true))
        this.Atoms.push(new Atom(this, (screenWidth / 5) * 3, screenHeight * .1, Constants.Atoms.Carbon, true))
        this.Atoms.push(new Atom(this, (screenWidth / 5) * 4, screenHeight * .1, Constants.Atoms.Nitrogen, true))

        this.Molecules.push(new Molecule(this, (screenWidth / 4) * 1, screenHeight * .85, [{ x: -40, y: 0, rad: 50 }, { x: 40, y: 0, rad: 50 }]))
        this.Molecules.push(new Molecule(this, (screenWidth / 4) * 2, screenHeight * .85, [{ x: -30, y: 30, rad: 50 }, { x: 30, y: 30, rad: 50 }, { x: 0, y: -30, rad: 50 }]))
        this.Molecules.push(new Molecule(this, (screenWidth / 4) * 3, screenHeight * .85, [{ x: 0, y: 0, rad: 50 }, { x: 70, y: 0, rad: 50 }, { x: -50, y: -55, rad: 50 }, { x: -50, y: 55, rad: 50 }]))

        this.input.on('drag', function(pointer, gameObject, dragX, dragY) {
            this.scene.Atoms.forEach(atom => {
                if (!atom.original && atom.x === gameObject.x && atom.y === gameObject.y) {
                    let nearestArc = getNearestArc(atom, pointer)
                    if (nearestArc.dist < 20) {
                        let angle = Phaser.Math.Angle.BetweenPoints(atom, pointer)
                        if (Math.abs(nearestArc.arc.obj.angle - Phaser.Math.RadToDeg(angle)) < .05) {
                            atom.seperateArc(nearestArc.arc)
                        } else {
                            let lowestAngle = getlowestAngleBetweenArcs(atom, nearestArc.arc, angle)
                            if (lowestAngle.angle > 60) {
                                nearestArc.arc.electrons.forEach(electron => {
                                    let p = Utilities.rotate_point(electron.obj.x, electron.obj.y, atom.x, atom.y, angle - Phaser.Math.DegToRad(nearestArc.arc.obj.angle))
                                    electron.obj.x = p.x
                                    electron.obj.y = p.y
                                    electron.offx = atom.x - p.x
                                    electron.offy = atom.y - p.y
                                });
                                nearestArc.arc.obj.angle = Phaser.Math.RadToDeg(angle)
                            }
                        }
                    }
                }
            });
        });
    }

    update() {
        // this.Atoms.forEach(atom => {
        //     atom.arcs.forEach(arc => {
        //         let lowestAngle = getlowestAngleBetweenArcs(atom, arc, Phaser.Math.DegToRad(arc.obj.angle))
        //         if (lowestAngle.angle < 50) {
        //             atom.combineArcs(arc, lowestAngle.arc)
        //         }
        //     });
        // });
    }
}

function getlowestAngleBetweenArcs(atom, arcToCheck, angle) {
    let lowest = 360
    let arcFound
    atom.arcs.forEach(arc => {
        if (arc.obj.angle !== arcToCheck.obj.angle) {
            let dist = Math.abs(Phaser.Math.Angle.WrapDegrees(arc.obj.angle - Phaser.Math.RadToDeg(angle)))
            if (dist < lowest) {
                arcFound = arc
                lowest = dist
            }
        }
    });
    return { angle: lowest, arc: arcFound }
}

function getNearestArc(atom, pointer) {
    let nearest = 9999
    let arcFound
    atom.arcs.forEach(arc => {
        arc.electrons.forEach(electron => {
            let dist = Phaser.Math.Distance.Between(electron.obj.x, electron.obj.y, pointer.x, pointer.y)
            if (dist < nearest) {
                arcFound = arc
                nearest = dist
            }
        });
    });
    return { dist: nearest, arc: arcFound }
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
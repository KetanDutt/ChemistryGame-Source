import { Utilities } from "../Utilities";

export class Atom {
    constructor(scene, x, y, type, original) {
        this.scene = scene
        this.x = x
        this.y = y
        this.type = type
        this.original = original
        this.valency = type.electrons
        this.bonds = []

        this.text = scene.add.text(x, y, type.text, Utilities.textStyle).setOrigin(0.5)

        this.arcs = []
        for (let i = 0; i < type.electrons; i++) {
            let arc = scene.add.graphics();
            arc.x = x
            arc.y = y
            arc.lineStyle(1, 0xffffff, 1);
            arc.beginPath();
            let p2 = { x: type.rad * 1.6, y: 0 }
            let intersections = Utilities.intersectionsBetweenCircles({ x: 0, y: 0, r: type.rad }, { x: p2.x, y: p2.y, r: type.rad })
            arc.arc(p2.x, p2.y, type.rad, Math.atan2(intersections.y - p2.y, intersections.x - p2.x), Math.atan2(intersections.y1 - p2.y, intersections.x1 - p2.x), true);
            arc.strokePath();
            arc.angle = (360 / type.electrons) * i

            if (i + 1 < type.electrons) {
                let p = Utilities.rotate_point(x + type.rad * .8, y + 10, x, y, Phaser.Math.DegToRad((360 / type.electrons) * i))
                let p3 = Utilities.rotate_point(x + type.rad * .8, y - 10, x, y, Phaser.Math.DegToRad((360 / type.electrons) * i))
                this.arcs.push({
                    electrons: [createElectron(scene, p, x, y), createElectron(scene, p3, x, y)],
                    obj: arc
                });
                i++
            } else {
                let p = Utilities.rotate_point(x + type.rad * .8, y, x, y, Phaser.Math.DegToRad((360 / type.electrons) * i))
                this.arcs.push({
                    electrons: [createElectron(scene, p, x, y)],
                    obj: arc
                });
            }
        }

        this.circleOuter = scene.add.circle(x, y, type.rad).setStrokeStyle(2, 0xffffff).setInteractive()
        scene.input.setDraggable(this.circleOuter, true)
        this.circle = scene.add.circle(x, y, type.rad * .5).setStrokeStyle(1, 0x555555).setInteractive()
        this.circle.on('pointerdown', (pointer) => {
            if (this.original) {
                console.log("spawn")
                this.original = false
                this.scene.Atoms.push(new Atom(this.scene, this.x, this.y, this.type, true))
            }
        })
        this.circle.on('drag', (pointer, dragX, dragY) => {
            this.move(dragX, dragY)
        })
        scene.input.setDraggable(this.circle, true)
    }

    move(dragX, dragY) {
        if (this.original) {
            return
        }
        this.x = dragX
        this.y = dragY
        this.circle.x = dragX
        this.circle.y = dragY
        this.circleOuter.x = dragX
        this.circleOuter.y = dragY
        this.text.x = dragX
        this.text.y = dragY
        this.arcs.forEach(arc => {
            arc.obj.x = dragX
            arc.obj.y = dragY
            arc.electrons.forEach(electron => {
                electron.obj.x = dragX - electron.offx
                electron.obj.y = dragY - electron.offy
            });
        });
    }

    combineArcs(arc, arc2) {
        arc2.electrons.forEach(electron => {
            arc.electrons.push(electron)
        })
        arc2.obj.visible = false
    }

    seperateArc(arc) {
        if (arc.electrons.length > 1) {
            let arc2 = this.scene.add.graphics();
            arc2.x = this.x
            arc2.y = this.y
            arc2.lineStyle(1, 0xffffff, 1);
            arc2.beginPath();
            let p2 = { x: this.type.rad * 1.6, y: 0 }
            let intersections = Utilities.intersectionsBetweenCircles({ x: 0, y: 0, r: this.type.rad }, { x: p2.x, y: p2.y, r: this.type.rad })
            arc2.arc(p2.x, p2.y, this.type.rad, Math.atan2(intersections.y - p2.y, intersections.x - p2.x), Math.atan2(intersections.y1 - p2.y, intersections.x1 - p2.x), true);
            arc2.strokePath();
            arc2.angle = arc.obj.angle + 80

            let p = Utilities.rotate_point(this.x + this.type.rad * .8, this.y, this.x, this.y, Phaser.Math.DegToRad(arc.obj.angle + 80))
            let electron = arc.electrons.pop();
            electron.obj.x = p.x
            electron.obj.y = p.y
            electron.offx = this.x - p.x
            electron.offy = this.y - p.y
            this.arcs.push({
                electrons: [electron],
                obj: arc2
            });
        }
    }
}

function createElectron(scene, p, x, y) {
    return {
        obj: scene.add.circle(p.x, p.y, 3, 0x00ffff).setStrokeStyle(1, 0x00ffff),
        offx: x - p.x,
        offy: y - p.y,
    }
}
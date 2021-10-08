import { Utilities } from "../Utilities";

export class Atom {
    constructor(scene, x, y, type) {
        this.x = x
        this.y = y
        this.type = type
        this.valency = type.electrons
        this.bonds = []

        this.text = scene.add.text(x, y, type.text, Utilities.textStyle).setOrigin(0.5)

        this.electrons = []
        for (let i = 0; i < type.electrons; i++) {
            let p = Utilities.rotate_point(x + type.rad * .8, y, x, y, Phaser.Math.DegToRad((360 / type.electrons) * i))

            let arc = scene.add.graphics();
            arc.lineStyle(1, 0x00ffff, 1);
            arc.beginPath();
            let p2 = Utilities.rotate_point(x + type.rad * 1.6, y, x, y, Phaser.Math.DegToRad((360 / type.electrons) * i))
            let intersections = Utilities.intersections({ x: x, y: y, r: type.rad }, { x: p2.x, y: p2.y, r: type.rad })
            arc.arc(p2.x, p2.y, type.rad, Math.atan2(intersections.y - p2.y, intersections.x - p2.x), Math.atan2(intersections.y1 - p2.y, intersections.x1 - p2.x), true);
            arc.strokePath();

            this.electrons.push({
                obj: scene.add.circle(p.x, p.y, 2, 0x00ffff).setStrokeStyle(1, 0x00ffff),
                arc: {
                    obj: arc,
                    offx: x - arc.x,
                    offy: y - arc.y,
                },
                offx: x - p.x,
                offy: y - p.y,
                valent: true
            });
        }

        this.circle = scene.add.circle(x, y, type.rad).setStrokeStyle(1, 0xffffff).setInteractive()
        this.circle.on('drag', (pointer, dragX, dragY) => {
            this.move(dragX, dragY)
        })
        scene.input.setDraggable(this.circle, true)

    }
    move(dragX, dragY) {
        this.x = dragX
        this.y = dragY
        this.circle.x = dragX
        this.circle.y = dragY
        this.text.x = dragX
        this.text.y = dragY
        this.electrons.forEach(electron => {
            electron.obj.x = dragX - electron.offx
            electron.obj.y = dragY - electron.offy
            electron.arc.obj.x = dragX - electron.arc.offx
            electron.arc.obj.y = dragY - electron.arc.offy
        });
    }
}
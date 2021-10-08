import { Utilities } from "../Utilities";

export class Molecule {
    constructor(scene, x, y, circles) {
        this.x = x
        this.y = y
        this.circles = []
        circles.forEach(circle => {
            this.circles.push(scene.add.circle(x + circle.x, y + circle.y, circle.rad).setStrokeStyle(1, 0xffffff))
        });
    }
}
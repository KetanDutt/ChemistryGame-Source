export const Utilities = {
    fullScreen: function(scene) {
        if (!scene.scale.isFullscreen) {
            scene.scale.toggleFullscreen();
        }
    },
    textStyle: {
        fontFamily: 'Verdana, Arial, Helvetica, sans-serif',
        fontSize: 20,
        color: '#ffffff',
        align: 'center',
    },
    rotate_point: function(px, py, cx, cy, angle) {
        let s = Math.sin(angle);
        let c = Math.cos(angle);

        // translate point back to origin:
        px -= cx;
        py -= cy;

        // rotate point
        let xnew = px * c - py * s;
        let ynew = px * s + py * c;

        // translate point back:
        px = xnew + cx;
        py = ynew + cy;
        return { x: px, y: py };
    },
    intersections: function(c1, c2) {
        let p0 = new Phaser.Math.Vector2(c1.x, c1.y)
        let p1 = new Phaser.Math.Vector2(c2.x, c2.y)
        let d = p0.distance(p1);
        let a = (c1.r * c1.r - c2.r * c2.r + d * d) / (2 * d);
        let h = Math.sqrt(c1.r * c1.r - a * a);
        let p12 = new Phaser.Math.Vector2(p1.x, p1.y)
        let p2 = p1.subtract(p0).scale(a / d).add(p0);
        let x3 = p2.x + h * (p12.y - p0.y) / d;
        let y3 = p2.y - h * (p12.x - p0.x) / d;
        let x4 = p2.x - h * (p12.y - p0.y) / d;
        let y4 = p2.y + h * (p12.x - p0.x) / d;

        return { x: x3, y: y3, x1: x4, y1: y4 };
    }

}
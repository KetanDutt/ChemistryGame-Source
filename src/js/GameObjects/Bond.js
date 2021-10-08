import { Utilities } from "../Utilities";

export class Bond {
    constructor(scene, atom1, atom2) {
        this.atom1 = atom1
        this.atom2 = atom2
        atom1.valency -= 1
        atom2.valency -= 1
        atom1.bonds.push(this)
        atom2.bonds.push(this)
    }
}
// Level campaign. Each level defines a target molecule as:
//   atoms: element symbols (index-addressed)
//   bonds: [atomA, atomB, order] — order 1 single, 2 double, 3 triple
// The definitions are validated at boot by Chem.validateLevel (and by the
// test suite) so a chemically impossible level can never ship.
export const LEVELS = [
    {
        name: "Hydrogen", formula: "H₂", hint: "Two hydrogens share one pair of electrons.",
        atoms: ["H", "H"], bonds: [[0, 1, 1]]
    },
    {
        name: "Water", formula: "H₂O", hint: "Oxygen makes two bonds — one to each hydrogen.",
        atoms: ["O", "H", "H"], bonds: [[0, 1, 1], [0, 2, 1]]
    },
    {
        name: "Oxygen", formula: "O₂", hint: "Two oxygens share TWO pairs: drop one on the other twice for a double bond.",
        atoms: ["O", "O"], bonds: [[0, 1, 2]]
    },
    {
        name: "Carbon dioxide", formula: "CO₂", hint: "Carbon sits in the middle with a double bond to each oxygen.",
        atoms: ["C", "O", "O"], bonds: [[0, 1, 2], [0, 2, 2]]
    },
    {
        name: "Ammonia", formula: "NH₃", hint: "Nitrogen bonds to three hydrogens.",
        atoms: ["N", "H", "H", "H"], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1]]
    },
    {
        name: "Methane", formula: "CH₄", hint: "Carbon loves four bonds. Feed it four hydrogens.",
        atoms: ["C", "H", "H", "H", "H"], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1]]
    },
    {
        name: "Nitrogen", formula: "N₂", hint: "The strongest bond in the game: three shared pairs.",
        atoms: ["N", "N"], bonds: [[0, 1, 3]]
    },
    {
        name: "Hydrogen cyanide", formula: "HCN", hint: "H–C, then a triple bond from carbon to nitrogen.",
        atoms: ["H", "C", "N"], bonds: [[0, 1, 1], [1, 2, 3]]
    },
    {
        name: "Formaldehyde", formula: "CH₂O", hint: "Two single bonds to hydrogen, one double bond to oxygen.",
        atoms: ["C", "H", "H", "O"], bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 2]]
    },
    {
        name: "Ethane", formula: "C₂H₆", hint: "Two carbons bonded together, each holding three hydrogens.",
        atoms: ["C", "C", "H", "H", "H", "H", "H", "H"],
        bonds: [[0, 1, 1], [0, 2, 1], [0, 3, 1], [0, 4, 1], [1, 5, 1], [1, 6, 1], [1, 7, 1]]
    }
];

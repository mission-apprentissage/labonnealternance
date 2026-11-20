/**
 * Valeurs du SMIC exprimées en euros
 * Source : https://www.service-public.gouv.fr/particuliers/vosdroits/F2300
 */
type MontantsSmic = {
  brut: { horaire: number; mensuel: number }
  net: { horaire: number; mensuel: number }
}

type BaremeSmic = {
  dateEffet: Date
  metropole: MontantsSmic
  mayotte: MontantsSmic
}

// Barème précédent, à supprimer à la prochaine revalorisation.
const SMIC_2026_06_01: BaremeSmic = {
  dateEffet: new Date("2026-06-01T00:00:00"),
  metropole: {
    brut: { horaire: 12.31, mensuel: 1867.02 },
    net: { horaire: 9.74, mensuel: 1477.93 },
  },
  mayotte: {
    brut: { horaire: 9.56, mensuel: 1449.93 },
    net: { horaire: 8.53, mensuel: 1293.97 },
  },
}

// Métropole : +1,6 % annoncé par le gouvernement, à confirmer par le décret (#5953).
// Mayotte : montants du 1er juin 2026 reconduits tant que la nouvelle valeur n'est pas publiée.
const SMIC_2026_12_01: BaremeSmic = {
  dateEffet: new Date("2026-12-01T00:00:00"),
  metropole: {
    brut: { horaire: 12.51, mensuel: 1897.39 },
    net: { horaire: 9.9, mensuel: 1501.6 },
  },
  mayotte: SMIC_2026_06_01.mayotte,
}

export const SMIC: BaremeSmic = SMIC_2026_12_01

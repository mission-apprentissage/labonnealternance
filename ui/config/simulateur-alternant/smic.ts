/**
 * Valeurs du SMIC exprimées en euros
 * Source : https://www.service-public.gouv.fr/particuliers/vosdroits/F2300
 */
const SMIC_HORAIRE_BRUT: number = 12.02
const SMIC_MENSUEL_BRUT: number = 1823.03
const SMIC_HORAIRE_NET: number = 9.52
const SMIC_MENSUEL_NET: number = 1443.11

const SMIC_HORAIRE_BRUT_MAYOTTE: number = 9.33
const SMIC_MENSUEL_BRUT_MAYOTTE: number = 1415.05
const SMIC_HORAIRE_NET_MAYOTTE: number = 8.33
const SMIC_MENSUEL_NET_MAYOTTE: number = 1262.79

export const SMIC = {
  metropole: {
    brut: {
      horaire: SMIC_HORAIRE_BRUT,
      mensuel: SMIC_MENSUEL_BRUT,
    },
    net: {
      horaire: SMIC_HORAIRE_NET,
      mensuel: SMIC_MENSUEL_NET,
    },
  },
  mayotte: {
    brut: {
      horaire: SMIC_HORAIRE_BRUT_MAYOTTE,
      mensuel: SMIC_MENSUEL_BRUT_MAYOTTE,
    },
    net: {
      horaire: SMIC_HORAIRE_NET_MAYOTTE,
      mensuel: SMIC_MENSUEL_NET_MAYOTTE,
    },
  },
}

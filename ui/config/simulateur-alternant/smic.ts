/**
 * Valeurs du SMIC exprimées en euros
 * Source : https://www.service-public.gouv.fr/particuliers/vosdroits/F2300
 */
const SMIC_HORAIRE_BRUT: number = 12.31
const SMIC_MENSUEL_BRUT: number = 1867.02
const SMIC_HORAIRE_NET: number = 9.74
const SMIC_MENSUEL_NET: number = 1477.93

const SMIC_HORAIRE_BRUT_MAYOTTE: number = 9.56
const SMIC_MENSUEL_BRUT_MAYOTTE: number = 1449.93
const SMIC_HORAIRE_NET_MAYOTTE: number = 8.53
const SMIC_MENSUEL_NET_MAYOTTE: number = 1293.97

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

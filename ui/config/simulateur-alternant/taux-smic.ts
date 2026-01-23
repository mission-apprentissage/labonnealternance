/**
 * Multiplicateurs de rémunération selon l'âge et l'année de contrat pour l'apprentissage
 */
const APPRENTISSAGE_TAUX_1ERE_TRANCHE_AGE_1ERE_ANNEE_CONTRAT: number = 0.27
const APPRENTISSAGE_TAUX_1ERE_TRANCHE_AGE_2EME_ANNEE_CONTRAT: number = 0.39
const APPRENTISSAGE_TAUX_1ERE_TRANCHE_AGE_3EME_ANNEE_CONTRAT: number = 0.55
const APPRENTISSAGE_TAUX_1ERE_TRANCHE_AGE_4EME_ANNEE_CONTRAT: number = 0.55

const APPRENTISSAGE_TAUX_2EME_TRANCHE_AGE_1ERE_ANNEE_CONTRAT: number = 0.43
const APPRENTISSAGE_TAUX_2EME_TRANCHE_AGE_2EME_ANNEE_CONTRAT: number = 0.51
const APPRENTISSAGE_TAUX_2EME_TRANCHE_AGE_3EME_ANNEE_CONTRAT: number = 0.67
const APPRENTISSAGE_TAUX_2EME_TRANCHE_AGE_4EME_ANNEE_CONTRAT: number = 0.67

const APPRENTISSAGE_TAUX_3EME_TRANCHE_AGE_1ERE_ANNEE_CONTRAT: number = 0.53
const APPRENTISSAGE_TAUX_3EME_TRANCHE_AGE_2EME_ANNEE_CONTRAT: number = 0.61
const APPRENTISSAGE_TAUX_3EME_TRANCHE_AGE_3EME_ANNEE_CONTRAT: number = 0.78
const APPRENTISSAGE_TAUX_3EME_TRANCHE_AGE_4EME_ANNEE_CONTRAT: number = 0.78

const APPRENTISSAGE_TAUX_4EME_TRANCHE_AGE_1ERE_ANNEE_CONTRAT: number = 1.0
const APPRENTISSAGE_TAUX_4EME_TRANCHE_AGE_2EME_ANNEE_CONTRAT: number = 1.0
const APPRENTISSAGE_TAUX_4EME_TRANCHE_AGE_3EME_ANNEE_CONTRAT: number = 1.0
const APPRENTISSAGE_TAUX_4EME_TRANCHE_AGE_4EME_ANNEE_CONTRAT: number = 1.0

/**
 * Multiplicateurs de rémunération selon l'âge et le type de diplôme visé pour le contrat de professionnalisation
 */
const CONTRAT_PRO_TAUX_1ERE_TRANCHE_AGE_DIPLOME_1_3: number = 0.55
const CONTRAT_PRO_TAUX_1ERE_TRANCHE_AGE_DIPLOME_4_8: number = 0.65

const CONTRAT_PRO_TAUX_2EME_TRANCHE_AGE_DIPLOME_1_3: number = 0.7
const CONTRAT_PRO_TAUX_2EME_TRANCHE_AGE_DIPLOME_4_8: number = 0.8

const CONTRAT_PRO_TAUX_3EME_TRANCHE_AGE_DIPLOME_1_3: number = 1.0
const CONTRAT_PRO_TAUX_3EME_TRANCHE_AGE_DIPLOME_4_8: number = 1.0

export interface TrancheAge {
  min: number
  max: number | null // null = pas de limite supérieure (26+)
}

export type AnneeContrat = 1 | 2 | 3 | 4

export type NiveauDiplomeGroup = "inferieurBac" | "bacEtPlus"

export const TRANCHES_AGE_APPRENTISSAGE: Array<TrancheAge> = [
  { min: 14, max: 17 },
  { min: 18, max: 20 },
  { min: 21, max: 25 },
  { min: 26, max: null },
]

export const TRANCHES_AGE_PROFESSIONNALISATION: Array<TrancheAge> = [
  { min: 14, max: 20 },
  { min: 21, max: 25 },
  { min: 26, max: null },
]

// Taux pour l'apprentissage
// Indexé par les tranches d'âge et l'année de contrat
export const TAUX_APPRENTISSAGE: Record<number, Record<number, number>> = {
  0: {
    1: APPRENTISSAGE_TAUX_1ERE_TRANCHE_AGE_1ERE_ANNEE_CONTRAT, // 1ère année de contrat
    2: APPRENTISSAGE_TAUX_1ERE_TRANCHE_AGE_2EME_ANNEE_CONTRAT, // 2ème année de contrat
    3: APPRENTISSAGE_TAUX_1ERE_TRANCHE_AGE_3EME_ANNEE_CONTRAT, // 3ème année de contrat
    4: APPRENTISSAGE_TAUX_1ERE_TRANCHE_AGE_4EME_ANNEE_CONTRAT, // 4ème année de contrat
  }, // 14-17 ans
  1: {
    1: APPRENTISSAGE_TAUX_2EME_TRANCHE_AGE_1ERE_ANNEE_CONTRAT, // 1ère année de contrat
    2: APPRENTISSAGE_TAUX_2EME_TRANCHE_AGE_2EME_ANNEE_CONTRAT, // ... etc
    3: APPRENTISSAGE_TAUX_2EME_TRANCHE_AGE_3EME_ANNEE_CONTRAT,
    4: APPRENTISSAGE_TAUX_2EME_TRANCHE_AGE_4EME_ANNEE_CONTRAT,
  }, // 18-20 ans
  2: {
    1: APPRENTISSAGE_TAUX_3EME_TRANCHE_AGE_1ERE_ANNEE_CONTRAT,
    2: APPRENTISSAGE_TAUX_3EME_TRANCHE_AGE_2EME_ANNEE_CONTRAT,
    3: APPRENTISSAGE_TAUX_3EME_TRANCHE_AGE_3EME_ANNEE_CONTRAT,
    4: APPRENTISSAGE_TAUX_3EME_TRANCHE_AGE_4EME_ANNEE_CONTRAT,
  }, // 21-25 ans
  3: {
    1: APPRENTISSAGE_TAUX_4EME_TRANCHE_AGE_1ERE_ANNEE_CONTRAT,
    2: APPRENTISSAGE_TAUX_4EME_TRANCHE_AGE_2EME_ANNEE_CONTRAT,
    3: APPRENTISSAGE_TAUX_4EME_TRANCHE_AGE_3EME_ANNEE_CONTRAT,
    4: APPRENTISSAGE_TAUX_4EME_TRANCHE_AGE_4EME_ANNEE_CONTRAT,
  }, // 26+ ans
}

// Taux pour les contrats de professionnalisation
// Indexé par les tranches d'âge et le groupe de niveau de diplôme (pré ou post-bac)
export const TAUX_PROFESSIONNALISATION: Record<number, { inferieurBac: number; bacEtPlus: number }> = {
  0: {
    inferieurBac: CONTRAT_PRO_TAUX_1ERE_TRANCHE_AGE_DIPLOME_1_3,
    bacEtPlus: CONTRAT_PRO_TAUX_1ERE_TRANCHE_AGE_DIPLOME_4_8,
  }, // 14-20 ans
  1: {
    inferieurBac: CONTRAT_PRO_TAUX_2EME_TRANCHE_AGE_DIPLOME_1_3,
    bacEtPlus: CONTRAT_PRO_TAUX_2EME_TRANCHE_AGE_DIPLOME_4_8,
  }, // 21-25 ans
  2: {
    inferieurBac: CONTRAT_PRO_TAUX_3EME_TRANCHE_AGE_DIPLOME_1_3,
    bacEtPlus: CONTRAT_PRO_TAUX_3EME_TRANCHE_AGE_DIPLOME_4_8,
  }, // 26+ ans (minimum SMIC ou 85% SMC)
}

/**
 * MAPPING NIVEAU DIPLÔME → GROUPE
 * Niveaux 1-3 : Inférieur au Bac (inferieurBac)
 * Niveaux 4-8 : Bac+2 et plus (bacEtPlus)
 */
export const NIVEAU_DIPLOME_TO_GROUP: Record<number, NiveauDiplomeGroup> = {
  1: "inferieurBac",
  2: "inferieurBac",
  3: "inferieurBac",
  4: "bacEtPlus",
  5: "bacEtPlus",
  6: "bacEtPlus",
  7: "bacEtPlus",
  8: "bacEtPlus",
}

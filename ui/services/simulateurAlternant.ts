import {
  TRANCHES_AGE_APPRENTISSAGE,
  TRANCHES_AGE_PROFESSIONNALISATION,
  TAUX_APPRENTISSAGE,
  TAUX_PROFESSIONNALISATION,
  NIVEAU_DIPLOME_TO_GROUP,
  SMIC,
  DATE_DERNIERE_MISE_A_JOUR,
  DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE,
  TAUX_COTISATIONS_SALARIALES_AVANT_EXONERATION_APPRENTISSAGE_PRIVE,
  TAUX_COTISATIONS_SALARIALES_AVANT_EXONERATION_APPRENTISSAGE_PUBLIC,
  TAUX_COTISATIONS_SALARIALES_CONTRAT_PROFESSIONNALISATION,
  TAUX_EXONERATION_CHARGES_SALARIALES_APPRENTISSAGE_PUBLIC,
} from "@/config/simulateur-alternant"

import type { TrancheAge, AnneeContrat, NiveauDiplomeGroup } from "@/config/simulateur-alternant"

import { getAgeAtDate } from "@/utils/dateUtils"

type TrancheSalaire = {
  min: number
  max: number
}

type Secteur = "public" | "privé" | "nsp"

type TypeContrat = "apprentissage" | "professionnalisation"

type InputChargesSalariales = {
  typeContrat: TypeContrat
  dateSignature: Date
  secteur: Exclude<Secteur, "nsp">
  salaireHoraireBrut: number
  tauxSmic: number
}

export type InputSimulation = {
  typeContrat: TypeContrat
  niveauDiplome?: number
  dureeContrat: number
  dateSignature?: Date
  dateNaissance: Date
  isRegionMayotte?: boolean
  secteur: Secteur
}

export type AnneeSimulation = {
  tauxSmic: number
  salaireHoraireBrut: TrancheSalaire
  salaireMensuelBrut: TrancheSalaire
  salaireAnnuelBrut: TrancheSalaire
  salaireHoraireNet: TrancheSalaire
  salaireMensuelNet: TrancheSalaire
  salaireAnnuelNet: TrancheSalaire
}

export type OuputSimulation = {
  dateMiseAJour: Date
  anneesSimulation: Array<AnneeSimulation>
}

const findTrancheAgeIndex = (tranches: readonly TrancheAge[], age: number): number => {
  const index = tranches.findIndex((t) => age >= t.min && (t.max === null || age <= t.max))

  if (index === -1) {
    throw new Error(`Âge ${age} hors des tranches définies (min: ${tranches[0].min})`)
  }

  return index
}

const getNiveauDiplomeGroup = (niveauDiplome: number): NiveauDiplomeGroup => {
  const group = NIVEAU_DIPLOME_TO_GROUP[niveauDiplome]

  if (!group) {
    throw new Error(`Niveau de diplôme ${niveauDiplome} invalide (attendu: 1-8)`)
  }

  return group
}

const getTauxApprentissage = (age: number, anneeContrat: AnneeContrat): number => {
  const trancheIndex = findTrancheAgeIndex(TRANCHES_AGE_APPRENTISSAGE, age)
  const taux = TAUX_APPRENTISSAGE[trancheIndex]?.[anneeContrat]

  if (taux === undefined) {
    throw new Error(`Taux apprentissage non trouvé pour âge=${age}, année=${anneeContrat}`)
  }

  return taux
}

const getTauxProfessionnalisation = (age: number, niveauDiplome: number): number => {
  const trancheIndex = findTrancheAgeIndex(TRANCHES_AGE_PROFESSIONNALISATION, age)
  const groupe = getNiveauDiplomeGroup(niveauDiplome)
  const taux = TAUX_PROFESSIONNALISATION[trancheIndex]?.[groupe]

  if (taux === undefined) {
    throw new Error(`Taux professionnalisation non trouvé pour âge=${age}, niveau=${niveauDiplome}`)
  }

  return taux
}

const getTauxSmic = ({
  typeContrat,
  age,
  anneeContrat,
  niveauDiplome,
}: {
  typeContrat: "apprentissage" | "professionnalisation"
  age: number
  anneeContrat: AnneeContrat
  niveauDiplome: number
}): number => {
  if (typeContrat === "apprentissage") {
    return getTauxApprentissage(age, anneeContrat)
  }
  return getTauxProfessionnalisation(age, niveauDiplome)
}

const getAllTauxSmic = ({
  typeContrat,
  age,
  niveauDiplome,
  dureeContrat,
}: {
  typeContrat: "apprentissage" | "professionnalisation"
  age: number
  niveauDiplome: number
  dureeContrat: number
}): Array<number> => {
  const anneesContrat = Array.from({ length: dureeContrat }, (_, i) => (i + 1) as AnneeContrat)
  return anneesContrat.map((anneeContrat, index) =>
    getTauxSmic({
      typeContrat,
      age: age + index,
      anneeContrat: anneeContrat as AnneeContrat,
      niveauDiplome,
    })
  )
}

const getSmic = (isRegionMayotte: boolean) => {
  return isRegionMayotte ? SMIC.mayotte : SMIC.metropole
}

const getSalaireBrut = (tauxSmic: number, isRegionMayotte: boolean): { salaireHoraireBrut: number; salaireMensuelBrut: number; salaireAnnuelBrut: number } => {
  const smic = getSmic(isRegionMayotte)
  const salaireHoraireBrut = smic.brut.horaire * tauxSmic
  const salaireAnnuelBrut = Math.round(salaireHoraireBrut * 35 * 52)
  const salaireMensuelBrut = salaireAnnuelBrut / 12

  return {
    salaireHoraireBrut,
    salaireMensuelBrut,
    salaireAnnuelBrut,
  }
}

/**
 * Calcule les charges salariales horaires en fonction du type de contrat et du contexte
 *
 * Règles :
 * - Professionnalisation : taux fixe de cotisations salariales
 * - Apprentissage avant DATE_FIN_EXONERATION : exonération totale (0)
 * - Apprentissage secteur public après exonération : taux réduit (exonération partielle)
 * - Apprentissage secteur privé après exonération :
 *   - Si tauxSmic <= 50% : exonération totale (0)
 *   - Si tauxSmic > 50% : cotisations sur la part excédant 50% du SMIC
 */
export const getChargesSalariales = ({ typeContrat, dateSignature, secteur, tauxSmic, salaireHoraireBrut }: InputChargesSalariales): number => {
  // Professionnalisation : pas d"exonération
  if (typeContrat === "professionnalisation") {
    return salaireHoraireBrut * TAUX_COTISATIONS_SALARIALES_CONTRAT_PROFESSIONNALISATION
  }

  // Apprentissage : exonération totale si date signature <= date fin exonération
  if (dateSignature <= DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE) {
    return 0
  }

  // Apprentissage secteur public : exonération partielle
  if (secteur === "public") {
    const tauxApresExoneration = TAUX_COTISATIONS_SALARIALES_AVANT_EXONERATION_APPRENTISSAGE_PUBLIC * (1 - TAUX_EXONERATION_CHARGES_SALARIALES_APPRENTISSAGE_PUBLIC)
    return salaireHoraireBrut * tauxApresExoneration
  }

  // Apprentissage secteur privé : exonération sur la part <= 50% du SMIC
  if (secteur === "privé") {
    // Si le taux SMIC est <= 50%, exonération totale
    if (tauxSmic <= 0.5) {
      return 0
    }
    // Sinon, cotisations uniquement sur la part excédant 50%
    const tauxApresExoneration = ((tauxSmic - 0.5) / tauxSmic) * TAUX_COTISATIONS_SALARIALES_AVANT_EXONERATION_APPRENTISSAGE_PRIVE
    return salaireHoraireBrut * tauxApresExoneration
  }

  return 0
}

const getSalaireNet = ({
  salaireHoraireBrut,
  tauxSmic,
  secteur,
  typeContrat,
  dateSignature,
}: {
  salaireHoraireBrut: number
  tauxSmic: number
  secteur: Exclude<Secteur, "nsp">
  typeContrat: TypeContrat
  dateSignature: Date
}): { salaireHoraireNet: number; salaireMensuelNet: number; salaireAnnuelNet: number } => {
  const chargesSalariales = getChargesSalariales({
    typeContrat,
    dateSignature,
    secteur,
    salaireHoraireBrut,
    tauxSmic,
  })

  const salaireHoraireNet = salaireHoraireBrut - chargesSalariales
  const salaireAnnuelNet = Math.round(salaireHoraireNet * 35 * 52)
  const salaireMensuelNet = salaireAnnuelNet / 12

  return {
    salaireHoraireNet,
    salaireMensuelNet,
    salaireAnnuelNet,
  }
}

const getTrancheSalaire = (salaire: number, round: boolean = false): TrancheSalaire => {
  return {
    min: round ? Math.round(salaire * 0.97) : salaire * 0.97,
    max: round ? Math.round(salaire) : salaire,
  }
}

export const getSimulationInformation = ({
  typeContrat,
  niveauDiplome,
  dureeContrat,
  dateSignature,
  dateNaissance,
  isRegionMayotte,
  secteur,
}: InputSimulation): OuputSimulation => {
  const age = getAgeAtDate(dateNaissance, dateSignature)
  // Si l'utilisateur ne sait pas, on considère le secteur privé par défaut
  const formattedSecteur = secteur === "nsp" ? "privé" : (secteur as "public" | "privé")
  const tauxSmicParAnnee = getAllTauxSmic({
    typeContrat,
    age,
    niveauDiplome,
    dureeContrat,
  })

  const simulation = tauxSmicParAnnee.map((tauxSmic) => {
    const { salaireHoraireBrut, salaireMensuelBrut, salaireAnnuelBrut } = getSalaireBrut(tauxSmic, isRegionMayotte)
    const { salaireHoraireNet, salaireMensuelNet, salaireAnnuelNet } = getSalaireNet({
      salaireHoraireBrut,
      tauxSmic,
      secteur: formattedSecteur,
      typeContrat,
      dateSignature,
    })

    return {
      tauxSmic,
      salaireHoraireBrut: getTrancheSalaire(salaireHoraireBrut),
      salaireMensuelBrut: getTrancheSalaire(salaireMensuelBrut, true),
      salaireAnnuelBrut: getTrancheSalaire(salaireAnnuelBrut, true),
      salaireHoraireNet: getTrancheSalaire(salaireHoraireNet),
      salaireMensuelNet: getTrancheSalaire(salaireMensuelNet, true),
      salaireAnnuelNet: getTrancheSalaire(salaireAnnuelNet, true),
    }
  })

  return { anneesSimulation: simulation, dateMiseAJour: DATE_DERNIERE_MISE_A_JOUR }
}

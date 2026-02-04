import dayjs from "dayjs"
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
  MIN_DEBUT_CONTRAT,
  MIN_DATE_NAISSANCE,
  MAX_DATE_NAISSANCE,
} from "@/config/simulateur-alternant"

import type { TrancheAge, AnneeContrat, NiveauDiplomeGroup } from "@/config/simulateur-alternant"

type TrancheSalaire = {
  min: number
  max: number
}

type Secteur = "public" | "privé" | "nsp"

type TypeContrat = "apprentissage" | "professionnalisation"

type InputChargesSalariales = {
  typeContrat: TypeContrat
  dateSignatureContrat: Date
  secteur: Exclude<Secteur, "nsp">
  salaireHoraireBrut: number
  tauxSmic: number
}

export type InputSimulation = {
  typeContrat: TypeContrat
  niveauDiplome?: number
  dureeContrat: number
  dateSignatureContrat: Date
  dateNaissance: Date
  isRegionMayotte: boolean
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

export type OutputSimulation = {
  dateMiseAJour: Date
  anneesSimulation: Array<AnneeSimulation>
}

/**
 * Trouve l'index de la tranche d'âge correspondant à l'âge donné
 */
const findTrancheAgeIndex = (tranches: readonly TrancheAge[], age: number): number => {
  const index = tranches.findIndex((t) => age >= t.min && (t.max === null || age <= t.max))

  if (index === -1) {
    throw new Error(`Âge ${age} hors des tranches définies (min: ${tranches[0].min})`)
  }

  return index
}

/**
 * Déduit le groupe de niveau de diplôme à partir du niveau de diplôme
 * (1-3 : inférieur au bac, 4-8 : bac et plus)
 */
const getNiveauDiplomeGroup = (niveauDiplome: number): NiveauDiplomeGroup => {
  const group = NIVEAU_DIPLOME_TO_GROUP[niveauDiplome]

  if (!group) {
    throw new Error(`Niveau de diplôme ${niveauDiplome} invalide (attendu: 1-8)`)
  }

  return group
}

/**
 * Récupère le taux SMIC pour un contrat en apprentissage
 */
const getTauxSmicApprentissage = (age: number, anneeContrat: AnneeContrat): number => {
  const trancheIndex = findTrancheAgeIndex(TRANCHES_AGE_APPRENTISSAGE, age)
  const taux = TAUX_APPRENTISSAGE[trancheIndex]?.[anneeContrat]

  if (taux === undefined) {
    throw new Error(`Taux apprentissage non trouvé pour âge=${age}, année=${anneeContrat}`)
  }

  return taux
}

/**
 * Récupère le taux SMIC pour un contrat de professionnalisation
 */
const getTauxSmicProfessionnalisation = (age: number, niveauDiplome: number): number => {
  const trancheIndex = findTrancheAgeIndex(TRANCHES_AGE_PROFESSIONNALISATION, age)
  const groupe = getNiveauDiplomeGroup(niveauDiplome)
  const taux = TAUX_PROFESSIONNALISATION[trancheIndex]?.[groupe]

  if (taux === undefined) {
    throw new Error(`Taux professionnalisation non trouvé pour âge=${age}, niveau=${niveauDiplome}`)
  }

  return taux
}

/**
 * Récupère le taux SMIC en fonction du type de contrat
 */
const getTauxSmic = ({ typeContrat, age, anneeContrat, niveauDiplome }: { typeContrat: TypeContrat; age: number; anneeContrat: AnneeContrat; niveauDiplome: number }): number => {
  if (typeContrat === "apprentissage") {
    return getTauxSmicApprentissage(age, anneeContrat)
  }
  return getTauxSmicProfessionnalisation(age, niveauDiplome)
}

/**
 * Récupère le taux SMIC pour chaque année simulée (durée du contrat)
 */
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

/**
 * Récupère la valeur du SMIC en fonction de la région
 */
const getSmic = (isRegionMayotte: boolean) => {
  return isRegionMayotte ? SMIC.mayotte : SMIC.metropole
}

/**
 * Récupère la valeur de salaire brut en fonction du taux SMIC et de la région
 */
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
export const getChargesSalariales = ({ typeContrat, dateSignatureContrat, secteur, tauxSmic, salaireHoraireBrut }: InputChargesSalariales): number => {
  // Professionnalisation : pas d'exonération
  if (typeContrat === "professionnalisation") {
    return salaireHoraireBrut * TAUX_COTISATIONS_SALARIALES_CONTRAT_PROFESSIONNALISATION
  }

  // Apprentissage : exonération totale si date de signature de contrat <= date fin exonération
  if (dateSignatureContrat <= DATE_FIN_EXONERATION_CHARGES_APPRENTISSAGE) {
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

/**
 *
 * Déduit le salaire net à partir du salaire brut en fonction des charges salariales
 */
const getSalaireNet = ({
  salaireHoraireBrut,
  tauxSmic,
  secteur,
  typeContrat,
  dateSignatureContrat,
}: {
  salaireHoraireBrut: number
  tauxSmic: number
  secteur: Exclude<Secteur, "nsp">
  typeContrat: TypeContrat
  dateSignatureContrat: Date
}): { salaireHoraireNet: number; salaireMensuelNet: number; salaireAnnuelNet: number } => {
  const chargesSalariales = getChargesSalariales({
    typeContrat,
    dateSignatureContrat,
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

/**
 *
 * Crée une tranche de salaire (min, max) à partir d'un salaire donné
 */
const getTrancheSalaire = (salaire: number, round: boolean = false): TrancheSalaire => {
  return {
    min: round ? Math.round(salaire * 0.97) : salaire * 0.97,
    max: round ? Math.round(salaire) : salaire,
  }
}

const checkDataValidity = (input: Partial<InputSimulation>) => {
  const { typeContrat, niveauDiplome, dateSignatureContrat, dateNaissance, dureeContrat } = input
  if (typeContrat === "professionnalisation") {
    if (niveauDiplome === undefined) throw new Error("Le niveau de diplôme est requis pour un contrat de professionnalisation")
    if (niveauDiplome < 1 || niveauDiplome > 8) throw new Error("Niveau de diplôme invalide")
  }
  if (typeContrat === "apprentissage") {
    if (dateSignatureContrat === undefined) throw new Error("La date de signature de contrat est requise pour un contrat d'apprentissage")
    if (dateSignatureContrat < MIN_DEBUT_CONTRAT.toDate()) throw new Error(`La date de signature de contrat doit être postérieure au ${MIN_DEBUT_CONTRAT.format("DD/MM/YYYY")}`)
  }
  if (dateNaissance < MIN_DATE_NAISSANCE.toDate()) throw new Error(`La date de naissance doit être postérieure au ${MIN_DATE_NAISSANCE.format("DD/MM/YYYY")}`)
  if (dateNaissance > MAX_DATE_NAISSANCE.toDate()) throw new Error(`La date de naissance doit être antérieure au ${MAX_DATE_NAISSANCE.format("DD/MM/YYYY")}`)
  if (dureeContrat === undefined) throw new Error("La durée du contrat est requise")
  if (dureeContrat < 1 || dureeContrat > 4) throw new Error("La durée du contrat doit être comprise entre 1 et 4 ans")
}

/**
 * Calcul d'une rémunération d'alternant en fonction des paramètres fournis
 * Détermine année par année les rémunérations brute et nette journalières, mensuelles et annuelles
 */
export const getSimulationInformation = ({
  typeContrat,
  dateNaissance,
  dureeContrat,
  dateSignatureContrat,
  niveauDiplome,
  secteur,
  isRegionMayotte,
}: InputSimulation): OutputSimulation => {
  checkDataValidity({ typeContrat, dateNaissance, dureeContrat, dateSignatureContrat, niveauDiplome })

  const age = dayjs(dateSignatureContrat).diff(dayjs(dateNaissance), "year")
  // Si l'utilisateur ne sait pas, on considère le secteur privé par défaut
  const formattedSecteur = secteur === "nsp" ? "privé" : secteur
  if (typeContrat === "professionnalisation" && niveauDiplome === undefined) {
    throw new Error("Le niveau de diplôme est requis pour un contrat de professionnalisation")
  }
  const tauxSmicParAnnee = getAllTauxSmic({
    typeContrat,
    age,
    // Pour un contrat d'apprentissage, le niveau de diplôme n'influence pas le taux SMIC
    niveauDiplome: typeContrat === "apprentissage" ? 0 : niveauDiplome,
    dureeContrat,
  })

  const simulation = tauxSmicParAnnee.map((tauxSmic) => {
    const { salaireHoraireBrut, salaireMensuelBrut, salaireAnnuelBrut } = getSalaireBrut(tauxSmic, isRegionMayotte)
    const { salaireHoraireNet, salaireMensuelNet, salaireAnnuelNet } = getSalaireNet({
      salaireHoraireBrut,
      tauxSmic,
      secteur: formattedSecteur,
      typeContrat,
      dateSignatureContrat,
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

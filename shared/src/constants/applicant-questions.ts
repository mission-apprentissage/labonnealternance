import { assertUnreachable } from "../utils/assert-unreachable.js"
import { LBA_ITEM_TYPE } from "./lbaitem.js"

// Questions fixes posées par LBA, facultatives pour le candidat (#5561). Un libellé modifié ne correspond
// plus aux réponses déjà stockées : prévoir l'analyse data avant d'en changer un.
export const SPONTANEOUS_APPLICATION_QUESTIONS = [
  "Pourquoi souhaitez-vous rejoindre notre entreprise ?",
  "Quelles missions souhaiteriez-vous accomplir au sein de l’entreprise ? Décrivez le poste visé et votre contribution aux activités de l’entreprise.",
  "Décrivez vos expériences passées (stage, job, bénévolat) en lien avec le poste visé.",
] as const

export const PARTNER_JOB_APPLICATION_QUESTIONS = [
  "Pourquoi souhaitez-vous rejoindre notre entreprise ?",
  "Décrivez vos expériences passées (stage, job, bénévolat) en lien avec ce poste.",
  "Qu’aimeriez-vous apprendre à travers cette alternance ?",
] as const

export const getLbaApplicantQuestions = (jobType: LBA_ITEM_TYPE): readonly string[] => {
  switch (jobType) {
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      return SPONTANEOUS_APPLICATION_QUESTIONS
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
      return PARTNER_JOB_APPLICATION_QUESTIONS
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
    case LBA_ITEM_TYPE.FORMATION:
      return []
    default:
      assertUnreachable(jobType)
  }
}

export type IApplicantQuestions = {
  questions: readonly string[]
  /** Les questions du recruteur sont obligatoires dans le formulaire LBA, celles de LBA facultatives. */
  askedBy: "recruiter" | "lba"
}

// Les questions saisies par le recruteur, y compris celles d'une offre partenaire déposée par API, priment
// sur les questions fixes de LBA.
export const getApplicantQuestions = (jobType: LBA_ITEM_TYPE, recruiterQuestions: readonly string[] | null | undefined): IApplicantQuestions => {
  if (recruiterQuestions?.length) {
    return { questions: recruiterQuestions, askedBy: "recruiter" }
  }
  const lbaQuestions = getLbaApplicantQuestions(jobType)
  return { questions: lbaQuestions, askedBy: lbaQuestions.length ? "lba" : "recruiter" }
}

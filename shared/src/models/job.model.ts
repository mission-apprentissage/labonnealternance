import { Jsonify } from "type-fest"
import { zObjectId } from "zod-mongodb-schema"

import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE, TRAINING_RYTHM } from "../constants/recruteur.js"
import dayjs from "../helpers/dayjs.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"
import { assertUnreachable } from "../utils/assertUnreachable.js"
import { detectUrlAndEmails } from "../utils/detectUrlAndEmails.js"

import { ZReferentielRomeForJob, ZRomeCompetence } from "./rome.model.js"

export enum JOB_STATUS {
  ACTIVE = "Active",
  POURVUE = "Pourvue",
  ANNULEE = "Annulée",
  EN_ATTENTE = "En attente",
}

export enum JOB_STATUS_ENGLISH {
  ACTIVE = "Active",
  POURVUE = "Filled",
  ANNULEE = "Cancelled",
}

export function translateJobStatus(status: JOB_STATUS): JOB_STATUS_ENGLISH | undefined {
  switch (status) {
    case JOB_STATUS.ACTIVE:
      return JOB_STATUS_ENGLISH.ACTIVE
    case JOB_STATUS.POURVUE:
      return JOB_STATUS_ENGLISH.POURVUE
    case JOB_STATUS.ANNULEE:
      return JOB_STATUS_ENGLISH.ANNULEE
    case JOB_STATUS.EN_ATTENTE:
      return undefined
    default:
      assertUnreachable(status)
  }
}

export function traductionJobStatus(status: JOB_STATUS_ENGLISH): JOB_STATUS {
  switch (status) {
    case JOB_STATUS_ENGLISH.ACTIVE:
      return JOB_STATUS.ACTIVE
    case JOB_STATUS_ENGLISH.POURVUE:
      return JOB_STATUS.POURVUE
    case JOB_STATUS_ENGLISH.ANNULEE:
      return JOB_STATUS.ANNULEE
    default: {
      assertUnreachable(status)
    }
  }
}

export const ZJobType = z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)).describe("Type de contrat")

export const ZDelegation = z
  .object({
    siret_code: z.string().describe("SIRET de l'établissement"),
    email: z.string().describe("Email gestionnaire de l'établissement"),
    cfa_read_company_detail_at: z.date().nullish().describe("Date de consultation de l'offre"),
  })
  .strict()
  .openapi("Delegation")

export const ZJobFields = z
  .object({
    rome_label: z.string().nullish().describe("Libellé du métier concerné"),
    rome_appellation_label: z.string().nullish().describe("Libellé de l'appelation ROME"),
    job_level_label: extensions.buildEnum(NIVEAUX_POUR_LBA).nullish().describe("Niveau de formation visé en fin de stage"),
    job_start_date: z.coerce.date().describe("Date de début de l'alternance"),
    job_description: z.string().nullish().describe("Description de l'offre d'alternance - minimum 30 charactères si rempli"),
    job_employer_description: z.string().nullish().describe("Description de l'employer proposant l'offre d'alternance - minimum 30 charactères si rempli"),
    rome_code: z.array(z.string()).describe("Liste des romes liés au métier"),
    rome_detail: ZReferentielRomeForJob.nullish().describe("Détail du code ROME selon la nomenclature Pole emploi"),
    job_creation_date: z.date().nullish().describe("Date de creation de l'offre"),
    job_expiration_date: z.date().nullish().describe("Date d'expiration de l'offre"),
    job_update_date: z.date().nullish().describe("Date de dernière mise à jour de l'offre"),
    job_last_prolongation_date: z.date().nullish().describe("Date de dernière prolongation de l'offre"),
    job_prolongation_count: z.number().nullish().describe("Nombre de fois où l'offre a été prolongée"),
    relance_mail_expiration_J7: z.date().nullish().describe("Date de l'envoi du mail de relance avant expiration à J-7"),
    relance_mail_expiration_J1: z.date().nullish().describe("Date de l'envoi du mail de relance avant expiration à J-1"),
    job_status: extensions.buildEnum(JOB_STATUS).describe("Statut de l'offre"),
    job_status_comment: z.string().nullish().describe("Raison de la suppression de l'offre"),
    job_type: ZJobType,
    job_delegation_count: z.number().nullish().describe("Nombre de délégations"),
    delegations: z.array(ZDelegation).nullish().describe("Liste des délégations"),
    is_disabled_elligible: z.boolean().nullish().default(false).describe("Poste ouvert aux personnes en situation de handicap"),
    job_count: z.number().nullish().default(1).describe("Nombre de poste(s) ouvert(s) pour cette offre"),
    job_duration: z.number().min(6).max(36).nullish().describe("Durée du contrat en mois"),
    job_rythm: extensions.buildEnum(TRAINING_RYTHM).nullish().describe("Répartition de la présence de l'alternant en formation/entreprise"),
    custom_address: z.string().nullish().describe("Adresse personnalisée de l'entreprise"),
    custom_geo_coordinates: z.string().nullish().describe("Latitude/Longitude de l'adresse personnalisée de l'entreprise"),
    custom_job_title: z.string().nullish().describe("Titre personnalisée de l'offre"),
    stats_detail_view: z.number().nullish().describe("Nombre de vues de la page de détail"),
    stats_search_view: z.number().nullish().describe("Nombre de vues sur une page de recherche"),
    managed_by: z.string().nullish().describe("Id de l'utilisateur gérant l'offre"),
    competences_rome: ZRomeCompetence.nullish().describe("Compétences du code ROME sélectionnées par le recruteur"),
    offer_title_custom: z
      .string()
      .min(3, "L’intitulé est trop court. Sa taille doit être comprise entre 3 et 150 caractères.")
      .max(150, "L’intitulé est trop long. Sa taille doit être comprise entre 3 et 150 caractères.")
      .nullish()
      .refine((value: string | null | undefined) => (value ? detectUrlAndEmails(value).length === 0 : true), "Les urls et les emails sont interdits")
      .describe("Titre de l'offre saisi par le recruteur"),
  })
  .strict()
  .openapi("JobWritable")

export const ZJob = ZJobFields.extend({
  _id: zObjectId,
})
  .strict()
  .openapi("Job")

export const ZJobWithRomeDetail = ZJob.extend({
  rome_detail: ZReferentielRomeForJob.nullish(),
})
  .strict()
  .openapi("JobWithRomeDetail")

export const ZJobStartDateCreate = (now: dayjs.Dayjs | null = null) =>
  // Le changement de jour se fait à minuit (heure de Paris)
  ZJobFields.shape.job_start_date
    .refine(
      (date) => {
        const startOfDay = dayjs.tz(now ?? dayjs.tz()).startOf("days")
        return dayjs.tz(date).isSameOrAfter(startOfDay)
      },
      {
        message: "job_start_date must be greater or equal to today's date",
      }
    )
    .refine(
      (date) => {
        return dayjs.tz(date).isSameOrBefore(dayjs().add(2, "years"))
      },
      {
        message: "job_start_date must be lower or equal to today's date + 2 years",
      }
    )

export const ZJobCreate = ZJobFields.pick({
  rome_appellation_label: true,
  rome_code: true,
  rome_label: true,
  job_type: true,
  job_level_label: true,
  is_disabled_elligible: true,
  job_count: true,
  job_duration: true,
  job_rythm: true,
  job_description: true,
  delegations: true,
  competences_rome: true,
  offer_title_custom: true,
})
  .extend({
    job_start_date: ZJobStartDateCreate(),
  })
  .strict()
  .openapi("JobWrite")

export type IDelegation = z.output<typeof ZDelegation>

export type IJob = z.output<typeof ZJob>
export type IJobCreate = z.output<typeof ZJobCreate>
export type IJobWithRomeDetail = z.output<typeof ZJobWithRomeDetail>
export type IJobJson = Jsonify<z.input<typeof ZJob>>

export const ZNewDelegations = z
  .object({
    etablissementCatalogueIds: z.array(z.string()),
  })
  .strict()

export type INewDelegations = z.input<typeof ZNewDelegations>

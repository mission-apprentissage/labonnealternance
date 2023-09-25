import { Jsonify } from "type-fest"
import { z } from "zod"

import { zObjectId } from "./common"
import { ZRomeDetail } from "./rome.model"

export enum JOB_STATUS {
  ACTIVE = "Active",
  POURVUE = "Pourvue",
  ANNULEE = "Annulée",
  EN_ATTENTE = "En attente",
}

const allJobStatus = Object.values(JOB_STATUS)

export const ZDelegation = z
  .object({
    siret_code: z.string().nullish().describe("SIRET de l'établissement"),
    email: z.string().nullish().describe("Email gestionnaire de l'établissement"),
    cfa_read_company_detail_at: z.date().or(z.string()).describe("Date de consultation de l'offre"),
  })
  .strict()

export const ZJob = z
  .object({
    _id: zObjectId,
    rome_label: z.string().nullish().describe("Libellé du métier concerné"),
    rome_appellation_label: z.string().nullish().describe("Libellé de l'appelation ROME"),
    job_level_label: z.string().nullish().describe("Niveau de formation requis"),
    job_start_date: z.date().or(z.string()).nullish().describe("Date de début de l'alternance"),
    job_description: z.string().nullish().describe("Description de l'offre d'alternance"),
    job_employer_description: z.string().nullish().describe("Description de l'employer proposant l'offre d'alternance"),
    rome_code: z.array(z.string()).describe("Liste des romes liés au métier"),
    rome_detail: ZRomeDetail.describe("Détail du code ROME selon la nomenclature Pole emploi"),
    job_creation_date: z.date().nullish().describe("Date de creation de l'offre"),
    job_expiration_date: z.date().or(z.string()).nullish().describe("Date d'expiration de l'offre"),
    job_update_date: z.date().or(z.string()).describe("Date de dernière mise à jour de l'offre"),
    job_last_prolongation_date: z.date().or(z.string()).describe("Date de dernière prolongation de l'offre"),
    job_prolongation_count: z.number().describe("Nombre de fois où l'offre a été prolongée"),
    relance_mail_sent: z.boolean().describe("Statut de l'envoi du mail de relance avant expiration"),
    job_status: z.enum([allJobStatus[0], ...allJobStatus.slice(1)]).describe("Statut de l'offre"),
    job_status_comment: z.string().describe("Raison de la suppression de l'offre"),
    job_type: z
      .array(z.enum(["Apprentissage", "Professionnalisation"]))
      .nullish()
      .describe("Type de contrat"),
    is_multi_published: z.boolean().nullish().describe("Definit si l'offre est diffusée sur d'autres jobboard que La bonne alternance"),
    is_delegated: z.boolean().describe("Definit si l'entreprise souhaite déléguer l'offre à un CFA"),
    job_delegation_count: z.number().describe("Nombre de délégations"),
    delegations: z.array(ZDelegation).describe("Liste des délégations"),
    is_disabled_elligible: z.boolean().describe("Poste ouvert aux personnes en situation de handicap"),
    job_count: z.number().nullish().describe("Nombre de poste(s) ouvert(s) pour cette offre"),
    job_duration: z.number().nullish().describe("Durée du contrat en année"),
    job_rythm: z.string().nullish().describe("Répartition de la présence de l'alternant en formation/entreprise"),
    custom_address: z.string().nullish().describe("Adresse personnalisée de l'entreprise"),
    custom_geo_coordinates: z.string().nullish().describe("Latitude/Longitude de l'adresse personnalisée de l'entreprise"),
    stats_detail_view: z.number().nullish().describe("Nombre de vues de la page de détail"),
    stats_search_view: z.number().nullish().describe("Nombre de vues sur une page de recherche"),
  })
  .strict()

export type IJob = z.output<typeof ZJob>
export type IJobJson = Jsonify<z.input<typeof ZJob>>

import { z } from "zod"

import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { ZPointGeometry } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"
import { JOB_STATUS } from "./job.model"

const collectionName = "jobs_partners" as const

export enum JOBPARTNERS_LABEL {
  HELLOWORK = "Hellowork",
  OFFRES_EMPLOI_LBA = "La bonne alternance",
  OFFRES_EMPLOI_FRANCE_TRAVAIL = "France Travail",
}

const ZJobsPartnersApply = z.object({
  apply_url: z.string().nullable().describe("URL pour candidater"),
  apply_email: z.string().email().nullable().describe("Email de contact"),
  apply_phone: extensions.telephone().nullable().describe("Téléphone de contact"),
})

const ZJobsPartnersContract = z.object({
  contract_start: z.date().nullable().describe("Date de début de contrat"),
  contract_duration: z.number().nullable().describe("Durée du contract"),
  contract_type: z.array(z.string()).nullable().describe("type de contract, formaté à l'insertion"),
  contract_remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable().describe("Format de travail de l'offre"),
})

export const ZJobsPartnersJobOffer = z.object({
  offer_title: z.string().describe("Titre de l'offre"),
  offer_rome_code: z.array(extensions.romeCode()).describe("Code rome de l'offre"),
  offer_description: z.string().describe("description de l'offre, soit définit par le partenaire, soit celle du ROME si pas suffisament grande"),
  offer_diploma_level_label: extensions.buildEnum(NIVEAUX_POUR_LBA).nullable().describe("Niveau de diplome visé en fin d'étude, transformé pour chaque partenaire"),
  offer_desired_skills: z
    .union([z.array(z.any()), z.string()])
    .nullable()
    .describe("Compétence attendues par le candidat pour l'offre"),
  offer_acquired_skills: z
    .union([z.array(z.any()), z.string()])
    .nullable()
    .describe("Compétence acuqises durant l'alternance"),
  offer_access_condition: z
    .union([z.array(z.any()), z.string()])
    .nullable()
    .describe("Conditions d'accès à l'offre"),
  offer_creation_date: z.date().nullable().describe("Date de creation de l'offre"),
  offer_expiration_date: z.date().nullable().describe("Date d'expiration de l'offre. Si pas présente, mettre à creation_date + 60j"),
  offer_count: z.number().describe("Nombre de poste disponible"),
  offer_multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
  offer_origin: z.string().nullable().describe("Origine de l'offre provenant d'un aggregateur"),
  offer_status: extensions.buildEnum(JOB_STATUS).describe("Status de l'offre (surtout utilisé pour les offres ajouté par API)"),
})
export type IJobsPartnersJobOffer = z.output<typeof ZJobsPartnersJobOffer>

export const ZJobsPartnersWorkplace = z.object({
  workplace_siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  workplace_website: z.string().nullable().describe("Site web de l'entreprise"),
  workplace_raison_sociale: z.string().nullable().describe("Raison sociale"),
  workplace_enseigne: z.string().nullable().describe("Enseigne de l'entreprise"),
  workplace_name: z.string().nullable().describe("Nom customisé de l'entreprise"),
  workplace_description: z.string().nullable().describe("description de l'entreprise"),
  workplace_size: z.string().nullable().describe("Taille de l'entreprise"),
  workplace_address: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
  workplace_geopoint: ZPointGeometry.describe("Geolocalisation de l'offre"),
  workplace_idcc: z.number().nullable().describe("Identifiant convention collective"),
  workplace_opco: z.string().nullable().describe("Nom de l'OPCO"),
  workplace_naf_code: z.string().nullable().describe("code NAF"),
  workplace_naf_label: z.string().nullable().describe("Libelle NAF"),
})
export type IJobsPartnersWorkplace = z.output<typeof ZJobsPartnersWorkplace>

const ZJobsPartnerBase = z.object({
  _id: zObjectId,
  created_at: z.date().describe("Date de creation de l'offre"),
  partner_id: z.string().nullable().describe("Identifiant d'origine l'offre provenant du partenaire"),
  partner_label: extensions.buildEnum(JOBPARTNERS_LABEL).describe("Référence du partenaire"),
})
export const ZJobRecruiter = ZJobsPartnerBase.omit({ partner_id: true, partner_label: true }).merge(ZJobsPartnersWorkplace).merge(ZJobsPartnersApply)
export type IJobRecruiter = z.output<typeof ZJobRecruiter>

export const ZJobsPartners = ZJobsPartnerBase.merge(ZJobsPartnersWorkplace).merge(ZJobsPartnersApply).merge(ZJobsPartnersContract).merge(ZJobsPartnersJobOffer)
export type IJobsPartners = z.output<typeof ZJobsPartners>

export const ZJobsPartnersPostApiBody = z
  .object({
    contract_start: z.date(),
    contract_type: z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)),
    contract_duration: z.number(),
    contract_remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).optional(),
    offer_title: z.string(),
    offer_description: z.string(),
    offer_diploma_level_label: extensions.buildEnum(NIVEAUX_POUR_LBA),
    offer_desired_skills: z.union([z.array(z.any()), z.string()]).optional(),
    offer_acquired_skills: z.union([z.array(z.any()), z.string()]).optional(),
    offer_access_condition: z.union([z.array(z.any()), z.string()]).optional(),
    offer_rome_code: z.array(extensions.romeCode()).optional(),
    offer_creation_date: z.date().optional(),
    offer_expiration_date: z.date().optional(),
    offer_count: z.number().optional(),
    offer_multicast: z.boolean().optional(),
    offer_origin: z.string().optional(),
    workplace_siret: extensions.siret,
    workplace_website: z.string().optional(),
    workplace_description: z.string().optional(),
    workplace_size: z.string().optional(),
    workplace_address: z.string().optional(),
    workplace_idcc: z.number().optional(),
    workplace_opco: z.string().optional(),
    workplace_naf_code: z.string().optional(),
    workplace_naf_label: z.string().optional(),
    apply_url: z.string().optional(),
    apply_email: z.string().email().optional(),
    apply_phone: extensions.telephone().optional(),
  })
  .refine(({ apply_email, apply_phone, apply_url }) => apply_email || apply_phone || apply_url, {
    message: "At least one of apply_url, apply_email, or apply_phone is required",
    path: ["apply_url", "apply_email", "apply_phone"],
  })
export type IJobsPartnersPostApiBody = z.output<typeof ZJobsPartnersPostApiBody>

export const ZJobRecruiterApiFormat = z.object({
  _id: zObjectId,
  workplace: ZJobsPartnersWorkplace,
  apply: ZJobsPartnersApply,
  created_at: z.date().describe(""),
})
export type IJobRecruiterApiFormat = z.output<typeof ZJobRecruiterApiFormat>

export const ZJobsPartnersApiFormat = ZJobRecruiterApiFormat.extend({
  partner_id: z.string().nullable().describe("Identifiant d'origine l'offre provenant du partenaire"),
  partner_label: extensions.buildEnum(JOBPARTNERS_LABEL).describe("Référence du partenaire"),
  contract: ZJobsPartnersContract,
  job_offer: ZJobsPartnersJobOffer,
})
export type IJobsPartnersApiFormat = z.output<typeof ZJobsPartnersApiFormat>

export const ZJobOffer = ZJobsPartnersApiFormat.omit({ _id: true }).extend({ _id: z.string() })
export type IJobOffer = z.output<typeof ZJobOffer>

export const ZJobsApiResponseV2 = z.object({
  jobs: z.array(ZJobOffer),
  recruiters: z.array(ZJobRecruiterApiFormat),
})
export type IJobsPartnersResponse = z.output<typeof ZJobsApiResponseV2>

export default {
  zod: ZJobsPartners,
  indexes: [
    [{ workplace_geopoint: "2dsphere" }, {}],
    [{ offer_rome_code: 1 }, {}],
    [{ partner_label: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

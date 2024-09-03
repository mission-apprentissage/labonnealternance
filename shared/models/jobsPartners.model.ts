import { z } from "zod"

import { TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { ZPointGeometry } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"
import { JOB_STATUS, ZJobStartDateCreate } from "./job.model"
import { zOpcoLabel } from "./opco.model"

const collectionName = "jobs_partners" as const

export enum JOBPARTNERS_LABEL {
  HELLOWORK = "Hellowork",
  OFFRES_EMPLOI_LBA = "La bonne alternance",
  OFFRES_EMPLOI_FRANCE_TRAVAIL = "France Travail",
}

export const ZJobsPartnersRecruiterApi = z.object({
  _id: zObjectId,

  workplace_siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  workplace_website: z.string().nullable().describe("Site web de l'entreprise").default(null),
  workplace_name: z.string().nullable().describe("Nom customisé de l'entreprise"),
  workplace_brand: z.string().nullable().describe("Nom d'enseigne de l'établissement"),
  workplace_legal_name: z.string().nullable().describe("Nom légal de l'entreprise"),
  workplace_description: z.string().nullable().describe("description de l'entreprise").default(null),
  workplace_size: z.string().nullable().describe("Taille de l'entreprise"),
  workplace_address: z.object({
    label: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
  }),
  workplace_geopoint: ZPointGeometry.describe("Geolocalisation de l'offre"),
  workplace_idcc: z.number().nullable().describe("Identifiant convention collective"),
  workplace_opco: zOpcoLabel.nullable().describe("Nom de l'OPCO"), // enum ?
  workplace_naf_code: z.string().nullable().describe("code NAF"),
  workplace_naf_label: z.string().nullable().describe("Libelle NAF"),

  apply_url: z.string().nullable().describe("URL pour candidater").default(null),
  apply_phone: z.string().nullable().describe("Téléphone de contact").default(null),
})

export const zDiplomaEuropeanLevel = z.enum(["3", "4", "5", "6", "7"])

export type INiveauDiplomeEuropeen = z.output<typeof zDiplomaEuropeanLevel>

export const ZJobsPartnersOfferApi = ZJobsPartnersRecruiterApi.omit({
  _id: true,
}).extend({
  _id: z.union([zObjectId, z.string()]).nullable().describe("Identifiant de l'offre"),

  partner: z.string().describe("Référence du partenaire"),
  partner_job_id: z.string().nullable().describe("Identifiant d'origine l'offre provenant du partenaire").default(null),

  contract_start: z.date().nullable().describe("Date de début de contrat"),
  contract_duration: z.number().int().min(0).nullable().describe("Durée du contrat en mois"),
  contract_type: z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)).nullable().describe("type de contrat, formaté à l'insertion"),
  contract_remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable().describe("Format de travail de l'offre").default(null),

  offer_title: z.string().describe("Titre de l'offre"),
  // TODO: pluriel ?
  offer_rome_code: z.array(extensions.romeCode()).describe("Code rome de l'offre"),
  offer_description: z.string().describe("description de l'offre, soit définit par le partenaire, soit celle du ROME si pas suffisament grande"),
  offer_diploma_level: z
    .object({
      european: zDiplomaEuropeanLevel.describe("Niveau de diplome visé en fin d'étude, transformé pour chaque partenaire"),
      label: z.string().describe("Libellé du niveau de diplome"),
    })
    .nullable(),
  offer_desired_skills: z.array(z.string()).describe("Compétence attendues par le candidat pour l'offre").default([]),
  offer_to_be_acquired_skills: z.array(z.string()).describe("Compétence acuqises durant l'alternance").default([]),
  offer_access_conditions: z.array(z.string()).describe("Conditions d'accès à l'offre").default([]),
  offer_creation: z.date().nullable().describe("Date de creation de l'offre").default(null),
  offer_expiration: z.date().nullable().describe("Date d'expiration de l'offre. Si pas présente, mettre à creation_date + 60j").default(null),
  offer_opening_count: z.number().describe("Nombre de poste disponible").default(1),
  offer_status: extensions.buildEnum(JOB_STATUS).default(JOB_STATUS.ACTIVE).describe("Status de l'offre (surtout utilisé pour les offres ajouté par API)"),
})

const ZJobsPartnersRecruiterPrivateFields = z.object({
  apply_email: z.string().nullable().describe("Email de contact").default(null),
  offer_multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
  offer_origin: z.string().nullable().describe("Origine de l'offre provenant d'un aggregateur").default(null),

  created_at: z.date().describe("Date de creation de l'offre"),
})

export const ZJobsPartnersRecruiterPrivate = ZJobsPartnersRecruiterApi.merge(ZJobsPartnersRecruiterPrivateFields)

export const ZJobsPartnersOfferPrivate = ZJobsPartnersOfferApi.omit({
  _id: true,
})
  .merge(ZJobsPartnersRecruiterPrivateFields)
  .extend({
    _id: zObjectId,
  })

export type IJobsPartnersRecruiterApi = z.output<typeof ZJobsPartnersRecruiterApi>
export type IJobsPartnersOfferApi = z.output<typeof ZJobsPartnersOfferApi>

export type IJobsPartnersRecruiterPrivate = z.output<typeof ZJobsPartnersRecruiterPrivate>
export type IJobsPartnersOfferPrivate = z.output<typeof ZJobsPartnersOfferPrivate>
export type IJobsPartnersOfferPrivateInput = z.input<typeof ZJobsPartnersOfferPrivate>

const ZJobsPartnersPostApiBodyBase = ZJobsPartnersOfferPrivate.pick({
  partner_job_id: true,

  contract_duration: true,
  contract_type: true,
  contract_remote: true,

  offer_title: true,
  offer_rome_code: true,
  offer_desired_skills: true,
  offer_to_be_acquired_skills: true,
  offer_access_conditions: true,
  offer_creation: true,
  offer_expiration: true,
  offer_opening_count: true,
  offer_origin: true,
  offer_multicast: true,
  // offer_status: true,

  apply_url: true,
  apply_email: true,
  apply_phone: true,

  workplace_description: true,
  workplace_website: true,
}).extend({
  // TODO: job start date must be greate or equal to today's date --> why ?
  contract_start: ZJobStartDateCreate(),

  offer_rome_code: ZJobsPartnersOfferPrivate.shape.offer_rome_code.nullable().default(null),
  offer_description: ZJobsPartnersOfferPrivate.shape.offer_description.min(30, "Job description should be at least 30 characters"),
  offer_diploma_level_european: zDiplomaEuropeanLevel.nullable().default(null),

  workplace_siret: extensions.siret,
  workplace_address_label: z.string().nullable().default(null),
})

export const ZJobsPartnersWritableApi = ZJobsPartnersPostApiBodyBase.superRefine((data, ctx) => {
  const keys = ["apply_url", "apply_email", "apply_phone"] as const
  if (keys.every((key) => data[key] == null)) {
    ;["apply_url", "apply_email", "apply_phone"].forEach((key) => {
      ctx.addIssue({
        code: "custom",
        message: "At least one of apply_url, apply_email, or apply_phone is required",
        path: [key],
      })
    })
  }

  return data
})

export type IJobsPartnersWritableApi = z.output<typeof ZJobsPartnersWritableApi>

export default {
  zod: ZJobsPartnersOfferPrivate,
  indexes: [
    [{ workplace_geopoint: "2dsphere", offer_multicast: 1, offer_rome_code: 1 }, {}],
    [{ offer_multicast: 1, offer_rome_code: 1, offer_creation: -1 }, {}],
    [{ offer_multicast: 1, "offer_diploma_level.european": 1, offer_creation: -1 }, {}],
    [{ offer_multicast: 1, offer_rome_code: 1, "offer_diploma_level.european": 1, offer_creation: -1 }, {}],

    [{ partner: 1, partner_job_id: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

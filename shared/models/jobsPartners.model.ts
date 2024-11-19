import { z } from "zod"

import { TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { ZPointGeometry } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"
import { JOB_STATUS_ENGLISH } from "./job.model"
import { zOpcoLabel } from "./opco.model"

const collectionName = "jobs_partners" as const

export enum JOBPARTNERS_LABEL {
  HELLOWORK = "Hello work",
  OFFRES_EMPLOI_LBA = "La bonne alternance",
  OFFRES_EMPLOI_FRANCE_TRAVAIL = "France Travail",
  RH_ALTERNANCE = "RH Alternance",
}

export const ZJobsPartnersRecruiterApi = z.object({
  _id: zObjectId,

  workplace_siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  workplace_brand: z.string().nullable().describe("Nom d'enseigne de l'établissement"),
  workplace_legal_name: z.string().nullable().describe("Nom légal de l'entreprise"),
  workplace_website: z.string().nullable().describe("Site web de l'entreprise").default(null),
  workplace_name: z.string().nullable().describe("Nom customisé de l'entreprise").default(null),
  workplace_description: z.string().nullable().describe("description de l'entreprise").default(null),
  workplace_size: z.string().nullable().describe("Taille de l'entreprise"),
  workplace_address_label: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
  workplace_geopoint: ZPointGeometry.describe("Geolocalisation de l'offre"),
  workplace_idcc: z.number().nullable().describe("Identifiant convention collective"),
  workplace_opco: zOpcoLabel.nullable().describe("Nom de l'OPCO"), // enum ?
  workplace_naf_code: z.string().nullable().describe("code NAF"),
  workplace_naf_label: z.string().nullable().describe("Libelle NAF"),

  apply_url: z.string().url().describe("URL pour candidater"),
  apply_phone: z.string().nullable().describe("Téléphone de contact").default(null),
})

export const zDiplomaEuropeanLevel = z.enum(["3", "4", "5", "6", "7"])

export type INiveauDiplomeEuropeen = z.output<typeof zDiplomaEuropeanLevel>

export const ZJobsPartnersOfferApi = ZJobsPartnersRecruiterApi.omit({
  _id: true,
}).extend({
  _id: z.union([zObjectId, z.string()]).nullable().describe("Identifiant de l'offre"),

  partner_label: z.string().describe("Référence du partenaire"),
  partner_job_id: z.string().nullable().describe("Identifiant d'origine l'offre provenant du partenaire").default(null),

  contract_start: z.date().nullable().describe("Date de début de contrat"),
  contract_duration: z.number().int().min(0).nullable().describe("Durée du contrat en mois").default(null),
  contract_type: z
    .array(extensions.buildEnum(TRAINING_CONTRACT_TYPE))
    .describe("type de contrat, formaté à l'insertion")
    .default([TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]),
  contract_remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable().describe("Format de travail de l'offre").default(null),

  offer_title: z.string().min(3).describe("Titre de l'offre"),
  offer_rome_codes: z.array(extensions.romeCode()).describe("Code rome de l'offre"),
  offer_description: z.string().describe("description de l'offre, soit définit par le partenaire, soit celle du ROME si pas suffisament grande"),
  offer_target_diploma: z
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
  offer_status: extensions.buildEnum(JOB_STATUS_ENGLISH).default(JOB_STATUS_ENGLISH.ACTIVE).describe("Status de l'offre (surtout utilisé pour les offres ajouté par API)"),
})

const ZJobsPartnersRecruiterPrivateFields = z.object({
  apply_email: z.string().email().nullable().describe("Email de contact").default(null),
  offer_multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
  offer_origin: z.string().nullable().describe("Origine de l'offre provenant d'un aggregateur").default(null),

  created_at: z.date().describe("Date de creation de l'offre"),
  updated_at: z.date().describe("Date de mise à jour de l'offre"),
})

export const ZJobsPartnersRecruiterPrivate = ZJobsPartnersRecruiterApi.merge(ZJobsPartnersRecruiterPrivateFields)

export const ZJobsPartnersOfferPrivate = ZJobsPartnersOfferApi.omit({
  _id: true,
  apply_url: true,
})
  .merge(ZJobsPartnersRecruiterPrivateFields)
  .extend({
    _id: zObjectId,
    apply_url: ZJobsPartnersOfferApi.shape.apply_url.nullable().default(null),
  })

export type IJobsPartnersRecruiterApi = z.output<typeof ZJobsPartnersRecruiterApi>
export type IJobsPartnersOfferApi = z.output<typeof ZJobsPartnersOfferApi>

export type IJobsPartnersRecruiterPrivate = z.output<typeof ZJobsPartnersRecruiterPrivate>
export type IJobsPartnersOfferPrivate = z.output<typeof ZJobsPartnersOfferPrivate>
export type IJobsPartnersOfferPrivateInput = z.input<typeof ZJobsPartnersOfferPrivate>

const TIME_CLOCK_TOLERANCE = 300_000

const ZJobsPartnersPostApiBodyBase = ZJobsPartnersOfferPrivate.pick({
  partner_job_id: true,

  contract_duration: true,
  contract_type: true,
  contract_remote: true,

  offer_title: true,
  offer_rome_codes: true,
  offer_desired_skills: true,
  offer_to_be_acquired_skills: true,
  offer_access_conditions: true,
  offer_opening_count: true,
  offer_origin: true,
  offer_multicast: true,

  apply_email: true,

  workplace_description: true,
  workplace_website: true,
  workplace_name: true,
}).extend({
  contract_start: z
    .string({ message: "Expected ISO 8601 date string" })
    .datetime({ offset: true, message: "Expected ISO 8601 date string" })
    .pipe(z.coerce.date())
    .nullable()
    .default(null),
  offer_creation: z
    .string({ message: "Expected ISO 8601 date string" })
    .datetime({ offset: true, message: "Expected ISO 8601 date string" })
    .pipe(
      z.coerce.date().refine((value) => value.getTime() < Date.now() + TIME_CLOCK_TOLERANCE, {
        message: "Creation date cannot be in the future",
      })
    )
    .nullable()
    .default(null),
  offer_expiration: z
    .string({ message: "Expected ISO 8601 date string" })
    .datetime({ offset: true, message: "Expected ISO 8601 date string" })
    .pipe(
      z.coerce.date().refine((value) => value === null || value.getTime() > Date.now() - TIME_CLOCK_TOLERANCE, {
        message: "Expiration date cannot be in the past",
      })
    )
    .nullable()
    .default(null),
  offer_rome_codes: ZJobsPartnersOfferPrivate.shape.offer_rome_codes.nullable().default(null),
  offer_description: ZJobsPartnersOfferPrivate.shape.offer_description.min(30, "Job description should be at least 30 characters"),
  offer_target_diploma_european: zDiplomaEuropeanLevel.nullable().default(null),
  offer_status: extensions
    .buildEnum(JOB_STATUS_ENGLISH)
    .nullish()
    .default(JOB_STATUS_ENGLISH.ACTIVE)
    .describe("Status de l'offre (surtout utilisé pour les offres ajouté par API)"),

  workplace_siret: extensions.siret,
  workplace_address_label: z.string().nullable().default(null),

  apply_url: ZJobsPartnersOfferApi.shape.apply_url.nullable().default(null),
  apply_phone: extensions.telephone.nullable().describe("Téléphone de contact").default(null),
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
export type IJobsPartnersWritableApiInput = z.input<typeof ZJobsPartnersWritableApi>

export default {
  zod: ZJobsPartnersOfferPrivate,
  indexes: [
    [{ workplace_geopoint: "2dsphere", offer_multicast: 1, offer_rome_codes: 1 }, {}],
    [{ offer_multicast: 1, offer_rome_codes: 1, offer_creation: -1 }, {}],
    [{ offer_multicast: 1, "offer_target_diploma.european": 1, offer_creation: -1 }, {}],
    [{ offer_multicast: 1, offer_rome_codes: 1, "offer_target_diploma.european": 1, offer_creation: -1 }, {}],
    [{ partner_label: 1, partner_job_id: 1 }, { unique: true }],
  ],
  collectionName,
} as const satisfies IModelDescriptor

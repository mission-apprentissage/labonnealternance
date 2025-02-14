import { z } from "zod"

import { TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants/recruteur.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"

import { ZPointGeometry } from "./address.model.js"
import { IModelDescriptor, zObjectId } from "./common.js"
import { JOB_STATUS_ENGLISH } from "./job.model.js"
import { zOpcoLabel } from "./opco.model.js"

const collectionName = "jobs_partners" as const

export enum JOBPARTNERS_LABEL {
  HELLOWORK = "Hellowork",
  OFFRES_EMPLOI_LBA = "La bonne alternance",
  FRANCE_TRAVAIL = "France Travail",
  RH_ALTERNANCE = "RH Alternance",
  PASS = "PASS",
  METEOJOB = "Meteojob",
}

export enum FILTER_JOBPARTNERS_LABEL {
  HELLOWORK = JOBPARTNERS_LABEL.HELLOWORK,
  RH_ALTERNANCE = JOBPARTNERS_LABEL.RH_ALTERNANCE,
  METEOJOB = JOBPARTNERS_LABEL.METEOJOB,
}

export const ZJobsPartnersRecruiterApi = z.object({
  _id: zObjectId,
  workplace_siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  workplace_brand: z.string().nullable().describe("Nom d'enseigne de l'établissement"),
  workplace_legal_name: z.string().nullable().describe("Nom légal de l'entreprise"),
  workplace_website: z.string().nullable().describe("Site web de l'entreprise").openapi({ format: "uri" }),
  workplace_name: z.string().nullable().describe("Nom customisé de l'entreprise"),
  workplace_description: z.string().nullable().describe("description de l'entreprise"),
  workplace_size: z.string().nullable().describe("Taille de l'entreprise"),
  workplace_address_label: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
  workplace_geopoint: ZPointGeometry.describe("Geolocalisation de l'offre"),
  workplace_idcc: z.number().nullable().describe("Identifiant convention collective"),
  workplace_opco: zOpcoLabel.nullable().describe("Nom de l'OPCO"),
  workplace_naf_code: z.string().nullable().describe("code NAF"),
  workplace_naf_label: z.string().nullable().describe("Libelle NAF"),

  apply_url: z.string().url().describe("URL pour candidater"),
  apply_phone: z.string().nullable().describe("Téléphone de contact"),
  apply_recipient_id: z.string().nullish().describe("Identifiant permettant de candidaté via l'API, généré à la volé pour les offres LBA uniquement"),
})

export const zDiplomaEuropeanLevel = z.enum(["3", "4", "5", "6", "7"])

export type INiveauDiplomeEuropeen = z.output<typeof zDiplomaEuropeanLevel>

export const ZJobsPartnersOfferHistoryEvent = z.object({
  status: extensions.buildEnum(JOB_STATUS_ENGLISH).describe("Statut de l'accès"),
  reason: z.string().describe("Raison du changement de statut"),
  date: z.date().describe("Date de l'évènement"),
  granted_by: z.string().describe("Utilisateur à l'origine du changement"),
})

export const ZJobsPartnersOfferApi = ZJobsPartnersRecruiterApi.omit({
  _id: true,
}).extend({
  _id: z.union([zObjectId, z.string()]).nullable().describe("Identifiant de l'offre"),

  partner_label: z.string().describe("Référence du partenaire"),
  partner_job_id: z.string().describe("Identifiant d'origine de l'offre provenant du partenaire"),

  contract_start: z.date().nullable().describe("Date de début de contrat").openapi({ format: "date-time" }),
  contract_duration: z.number().int().min(0).nullable().describe("Durée du contrat en mois"),
  contract_type: z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)).describe("type de contrat, formaté à l'insertion"),
  contract_remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable().describe("Format de travail de l'offre"),

  offer_title: z.string().min(3).describe("Titre de l'offre"),
  offer_rome_codes: z.array(extensions.romeCode()).describe("Code rome de l'offre"),
  offer_description: z.string().describe("description de l'offre, soit définit par le partenaire, soit celle du ROME si pas suffisament grande"),
  offer_target_diploma: z
    .object({
      european: zDiplomaEuropeanLevel.describe("Niveau de diplome visé en fin d'étude, transformé pour chaque partenaire"),
      label: z.string().describe("Libellé du niveau de diplome"),
    })
    .nullable(),
  offer_desired_skills: z.array(z.string()).describe("Compétence attendues par le candidat pour l'offre"),
  offer_to_be_acquired_skills: z.array(z.string()).describe("Compétence acuqises durant l'alternance"),
  offer_access_conditions: z.array(z.string()).describe("Conditions d'accès à l'offre"),
  offer_creation: z.date().nullable().describe("Date de creation de l'offre").openapi({ format: "date-time" }),
  offer_expiration: z.date().nullable().describe("Date d'expiration de l'offre. Si pas présente, mettre à creation_date + 60j").openapi({ format: "date-time" }),
  offer_opening_count: z.number().describe("Nombre de poste disponible"),
  offer_status: extensions.buildEnum(JOB_STATUS_ENGLISH).describe("Status de l'offre (surtout utilisé pour les offres ajouté par API)"),
  offer_status_history: z.array(ZJobsPartnersOfferHistoryEvent).describe("Historique de l'offre"),
})

const ZJobsPartnersRecruiterPrivateFields = z.object({
  apply_email: z.string().email().nullable().describe("Email de contact").default(null),
  offer_multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
  offer_origin: z.string().nullable().describe("Origine de l'offre provenant d'un aggregateur").default(null),

  workplace_address_street_label: z.string().nullable().describe("Numéro et voie, provenant du SIRET ou du partenaire"),
  workplace_address_city: z.string().nullable().describe("Nom de ville, provenant du SIRET ou du partenaire"),
  workplace_address_zipcode: extensions.zipCode().nullable().describe("Code postal, provenant du SIRET ou du partenaire"),

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
    rank: z.number().nullish().describe("Valeur indiquant la qualité de l'offre. Plus la valeur est élevée, plus la qualité de l'offre est importante"),
  })

export const ZJobsPartnersOfferPrivateWithDistance = ZJobsPartnersOfferPrivate.extend({
  distance: z.number().nullish(),
})

export type IJobsPartnersRecruiterApi = z.output<typeof ZJobsPartnersRecruiterApi>
export type IJobsPartnersOfferApi = z.output<typeof ZJobsPartnersOfferApi>

export type IJobsPartnersRecruiterPrivate = z.output<typeof ZJobsPartnersRecruiterPrivate>
export type IJobsPartnersOfferPrivate = z.output<typeof ZJobsPartnersOfferPrivate>
export type IJobsPartnersOfferPrivateWithDistance = z.output<typeof ZJobsPartnersOfferPrivateWithDistance>
export type IJobsPartnersOfferPrivateInput = z.input<typeof ZJobsPartnersOfferPrivate>

const TIME_CLOCK_TOLERANCE = 300_000

export const ZJobsPartnersPostApiBodyBase = z.object({
  contract_start: z
    .string({ message: "Expected ISO 8601 date string" })
    .datetime({ offset: true, message: "Expected ISO 8601 date string" })
    .pipe(z.coerce.date())
    .nullable()
    .default(null),
  contract_duration: ZJobsPartnersOfferPrivate.shape.contract_duration.default(null),
  contract_type: ZJobsPartnersOfferPrivate.shape.contract_type.default([TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION]),
  contract_remote: ZJobsPartnersOfferPrivate.shape.contract_remote.default(null),

  offer_title: ZJobsPartnersOfferPrivate.shape.offer_title,
  offer_rome_codes: ZJobsPartnersOfferPrivate.shape.offer_rome_codes.nullable().default(null),
  offer_description: ZJobsPartnersOfferPrivate.shape.offer_description.min(30, "Job description should be at least 30 characters"),
  offer_target_diploma_european: zDiplomaEuropeanLevel.nullable().default(null),
  offer_desired_skills: ZJobsPartnersOfferPrivate.shape.offer_desired_skills.default([]),
  offer_to_be_acquired_skills: ZJobsPartnersOfferPrivate.shape.offer_to_be_acquired_skills.default([]),
  offer_access_conditions: ZJobsPartnersOfferPrivate.shape.offer_access_conditions.default([]),
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
  offer_opening_count: ZJobsPartnersOfferPrivate.shape.offer_opening_count.default(1),
  offer_origin: ZJobsPartnersOfferPrivate.shape.offer_origin,
  offer_status: ZJobsPartnersOfferPrivate.shape.offer_status.default(JOB_STATUS_ENGLISH.ACTIVE),
  offer_multicast: ZJobsPartnersOfferPrivate.shape.offer_multicast,

  workplace_siret: extensions.siret,
  workplace_description: ZJobsPartnersOfferPrivate.shape.workplace_description.default(null),
  workplace_website: ZJobsPartnersOfferPrivate.shape.workplace_website.default(null),
  workplace_name: ZJobsPartnersOfferPrivate.shape.workplace_name.default(null),
  workplace_address_label: z.string().nullable().default(null),
  apply_email: ZJobsPartnersOfferPrivate.shape.apply_email,
  apply_url: ZJobsPartnersOfferApi.shape.apply_url.nullable().default(null),
  apply_phone: extensions.telephone.nullable().describe("Téléphone de contact").default(null),
})

export const ZJobsPartnersWritableApi = ZJobsPartnersPostApiBodyBase.superRefine((data, ctx) => {
  const keys = ["apply_url", "apply_email", "apply_phone"] as const
  if (keys.every((key) => data[key] == null)) {
    keys.forEach((key) => {
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
    [{ workplace_geopoint: "2dsphere", offer_multicast: 1, offer_rome_codes: 1, offer_status: 1, offer_expiration: 1, partner_label: 1, "offer_target_diploma.european": 1 }, {}],
    [{ offer_multicast: 1, offer_rome_codes: 1, offer_creation: -1 }, {}],
    [{ offer_multicast: 1, "offer_target_diploma.european": 1, offer_creation: -1 }, {}],
    [{ partner_label: 1, partner_job_id: 1 }, { unique: true }],
    [{ partner_label: 1 }, {}],
    [{ offer_status: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

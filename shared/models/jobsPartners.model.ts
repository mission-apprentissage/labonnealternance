import { z } from "zod"

import { NIVEAU_DIPLOME_LABEL, OPCOS, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { ZPointGeometry } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "jobs_partners" as const

export enum JOBPARTNERS_LABEL {
  HELLOWORK = "Hellowork",
  OFFRES_EMPLOI_LBA = "La bonne alternance",
  OFFRES_EMPLOI_FRANCE_TRAVAIL = "France Travail",
}

export const ZJobsPartnersRecruiterApi = z.object({
  _id: zObjectId,

  workplace_siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  workplace_website: z.string().nullable().describe("Site web de l'entreprise"),
  workplace_name: z.string().nullable().describe("Nom customisé de l'entreprise"),
  workplace_description: z.string().nullable().describe("description de l'entreprise"),
  workplace_size: z.string().nullable().describe("Taille de l'entreprise"),
  workplace_address: z.object({
    label: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
  }),
  workplace_geopoint: ZPointGeometry.describe("Geolocalisation de l'offre"),
  workplace_idcc: z.number().nullable().describe("Identifiant convention collective"),
  workplace_opco: extensions.buildEnum(OPCOS).nullable().describe("Nom de l'OPCO"), // enum ?
  workplace_naf_code: z.string().nullable().describe("code NAF"),
  workplace_naf_label: z.string().nullable().describe("Libelle NAF"),

  apply_url: z.string().nullable().describe("URL pour candidater"),
  apply_phone: z.string().nullable().describe("Téléphone de contact"),
})

export const ZJobsPartnersOfferApi = ZJobsPartnersRecruiterApi.omit({
  _id: true,
}).extend({
  _id: z.union([zObjectId, z.string()]).nullable().describe("Identifiant de l'offre"),

  partner: extensions.buildEnum(JOBPARTNERS_LABEL).describe("Référence du partenaire"),
  partner_job_id: z.string().nullable().describe("Identifiant d'origine l'offre provenant du partenaire"),

  contract_start: z.date().nullable().describe("Date de début de contrat"),
  contract_duration: z.number().int().min(0).nullable().describe("Durée du contrat en mois"),
  contract_type: z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)).nullable().describe("type de contrat, formaté à l'insertion"),
  contract_remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable().describe("Format de travail de l'offre"),

  offer_title: z.string().describe("Titre de l'offre"),
  offer_rome_code: z.array(extensions.romeCode()).describe("Code rome de l'offre"),
  offer_description: z.string().describe("description de l'offre, soit définit par le partenaire, soit celle du ROME si pas suffisament grande"),
  offer_diploma_level: z
    .object({
      european: extensions.buildEnumKeys(NIVEAU_DIPLOME_LABEL).nullable().describe("Niveau de diplome visé en fin d'étude, transformé pour chaque partenaire"),
      label: z.string().nullable().describe("Libellé du niveau de diplome"),
    })
    .nullable(),
  offer_desired_skills: z.array(z.string()).describe("Compétence attendues par le candidat pour l'offre").nullable(),
  offer_to_be_acquired_skills: z.array(z.string()).describe("Compétence acuqises durant l'alternance").nullable(),
  offer_access_conditions: z.array(z.string()).nullable().describe("Conditions d'accès à l'offre"),
  offer_creation: z.date().nullable().describe("Date de creation de l'offre"),
  offer_expiration: z.date().nullable().describe("Date d'expiration de l'offre. Si pas présente, mettre à creation_date + 60j"),
  offer_opening_count: z.number().describe("Nombre de poste disponible"),
})

const ZJobsPartnersRecruiterPrivateFields = z.object({
  apply_email: z.string().nullable().describe("Email de contact"),
  offer_multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
  offer_origin: z.string().nullable().describe("Origine de l'offre provenant d'un aggregateur"),

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

export default {
  zod: ZJobsPartnersOfferPrivate,
  indexes: [
    [{ workplace_geopoint: "2dsphere" }, {}],
    [{ offer_rome_code: 1 }, {}],
    [{ partner: 1, partner_job_id: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

export const ZJobsOpportunityResponse = z.object({
  jobs: z.array(ZJobsPartnersOfferApi),
  recruiters: z.array(ZJobsPartnersRecruiterApi),
})

export type IJobsOpportunityResponse = z.output<typeof ZJobsOpportunityResponse>

import { z } from "zod"

import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { ZPointGeometry } from "./address.model"
import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "jobs_partners" as const

export enum JOBPARTNERS_LABEL {
  HELLOWORK = "Hellowork",
  OFFRES_EMPLOI_LBA = "La bonne alternance",
  OFFRES_EMPLOI_FRANCE_TRAVAIL = "France Travail",
}

export const ZJobsPartnersApply = z.object({
  url: z.string().nullable().describe("URL pour candidater"),
  email: z.string().nullable().describe("Email de contact"),
  phone: z.string().nullable().describe("Téléphone de contact"),
})

export const ZJobsPartnersContract = z.object({
  start: z.date().nullable().describe("Date de début de contrat"),
  duration: z.number().nullable().describe("Durée du contrat en mois"),
  type: z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)).nullable().describe("type de contrat, formaté à l'insertion"),
  remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable().describe("Format de travail de l'offre"),
})

export const ZJobsPartnersJobOffer = z.object({
  title: z.string().describe("Titre de l'offre"),
  rome_code: z.array(extensions.romeCode()).describe("Code rome de l'offre"),
  description: z.string().describe("description de l'offre, soit définit par le partenaire, soit celle du ROME si pas suffisament grande"),
  diploma_level_label: extensions.buildEnum(NIVEAUX_POUR_LBA).nullable().describe("Niveau de diplome visé en fin d'étude, transformé pour chaque partenaire"),
  desired_skills: z
    .union([z.array(z.any()), z.string()])
    .nullable()
    .describe("Compétence attendues par le candidat pour l'offre"),
  acquired_skills: z
    .union([z.array(z.any()), z.string()])
    .nullable()
    .describe("Compétence acuqises durant l'alternance"),
  access_condition: z
    .union([z.array(z.any()), z.string()])
    .nullable()
    .describe("Conditions d'accès à l'offre"),
  publication: z.object({
    creation_date: z.date().nullable().describe("Date de creation de l'offre"),
    expiration_date: z.date().nullable().describe("Date d'expiration de l'offre. Si pas présente, mettre à creation_date + 60j"),
  }),
  meta: z.object({
    count: z.number().describe("Nombre de poste disponible"),
    multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
    origin: z.string().nullable().describe("Origine de l'offre provenant d'un aggregateur"),
  }),
})
export type IJobsPartnersJobOffer = z.output<typeof ZJobsPartnersJobOffer>

export const ZJobsPartnersLocation = z
  .object({
    address: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
    geopoint: ZPointGeometry.describe("Geolocalisation de l'offre"),
  })
  .describe("Adresse définit par le SIRET ou transmise par le partenaire (tous les champs sont obligatoire)")

export const ZJobsPartnersWorkplace = z.object({
  siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  website: z.string().nullable().describe("Site web de l'entreprise"),
  raison_sociale: z.string().nullable().describe("Raison sociale"),
  enseigne: z.string().nullable().describe("Enseigne de l'entreprise"),
  name: z.string().nullable().describe("Nom customisé de l'entreprise"),
  description: z.string().nullable().describe("description de l'entreprise"),
  size: z.string().nullable().describe("Taille de l'entreprise"),
  location: ZJobsPartnersLocation,
  domaine: z.object({
    idcc: z.number().nullable().describe("Identifiant convention collective"),
    opco: z.string().nullable().describe("Nom de l'OPCO"),
    naf: z.object({
      code: z.string().nullable().describe("code NAF"),
      label: z.string().nullable().describe("Libelle NAF"),
    }),
  }),
})
export type IJobsPartnersWorkplace = z.output<typeof ZJobsPartnersWorkplace>

export const ZJobRecruiter = z.object({
  _id: zObjectId,
  workplace: ZJobsPartnersWorkplace,
  apply: ZJobsPartnersApply,
  created_at: z.date().describe("Date de creation de l'offre"),
})
export type IJobRecruiter = z.output<typeof ZJobRecruiter>

export const ZJobsPartners = ZJobRecruiter.extend({
  partner_id: z.string().nullable().describe("Identifiant d'origine l'offre provenant du partenaire"),
  partner_label: extensions.buildEnum(JOBPARTNERS_LABEL).describe("Référence du partenaire"),
  contract: ZJobsPartnersContract,
  job_offer: ZJobsPartnersJobOffer,
})
export type IJobsPartners = z.output<typeof ZJobsPartners>

export const ZJobOffer = ZJobsPartners.omit({ _id: true }).extend({ _id: z.string() })
export type IJobOffer = z.output<typeof ZJobOffer>

export const ZJobsApiResponseV2 = z.object({
  jobs: z.array(ZJobOffer),
  recruiters: z.array(ZJobRecruiter),
})
export type IJobsPartnersResponse = z.output<typeof ZJobsApiResponseV2>

export default {
  zod: ZJobsPartners,
  indexes: [
    [{ raw_id: 1 }, {}],
    [{ "workplace.location.geopoint": "2dsphere" }, {}],
    [{ "job_offer.rome_code": 1 }, {}],
    [{ partner_label: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

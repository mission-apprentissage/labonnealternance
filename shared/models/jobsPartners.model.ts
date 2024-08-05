import { z } from "zod"

import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE, TRAINING_REMOTE_TYPE } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "jobs_partners" as const

export enum JOBPARTNERS_LABEL {
  HELLOWORK = "hellowork",
  IMILO = "i-milo",
  MISSIONLOCALE = "mission-locale",
}

export enum LBA_JOB_TYPE {
  RECRUTEURS_LBA = "recruteurs_lba",
  OFFRES_EMPLOI_LBA = "offres_emploi_lba",
  OFFRES_EMPLOI_FRANCE_TRAVAIL = "offres_emploi_france_travail",
}

const ZJobsPartnersApply = z.object({
  url: z.string().nullable().describe("URL pour candidater"),
  email: z.string().nullable().describe("Email de contact"),
  phone: z.string().nullable().describe("Téléphone de contact"),
})

const ZJobsPartnersContract = z.object({
  start: z.date().nullable().describe("Date de début de contrat"),
  duration: z.string().nullable().describe("Durée du contract"),
  type: z.array(extensions.buildEnum(TRAINING_CONTRACT_TYPE)).nullable().describe("type de contract, formaté à l'insertion"),
  remote: extensions.buildEnum(TRAINING_REMOTE_TYPE).nullable().describe("Format de travail de l'offre"),
})

const ZJobsPartnersJobOffer = z.object({
  title: z.string().describe("Titre de l'offre"),
  rome_code: z.string().describe("Code rome de l'offre"),
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
    expiration_date: z.date().nullable().describe("Date d'expiration de l'offre. Si pas présente, mettre àcreation_date + 60j"),
  }),
  meta: z.object({
    count: z.number().describe("Nombre de poste disponible"),
    multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
    origin: z.string().nullable().describe("Origine de l'offre provenant d'un aggregateur"),
  }),
})

const ZJobsPartnersWorkplace = z.object({
  siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  website: z.string().nullable().describe("Site web de l'entreprise"),
  raison_sociale: z.string().nullable().describe("Raison sociale"),
  enseigne: z.string().nullable().describe("Enseigne de l'entreprise"),
  name: z.string().nullable().describe("Nom customisé de l'entreprise"),
  description: z.string().nullable().describe("description de l'entreprise"),
  size: z.string().nullable().describe("Taille de l'entreprise"),
  location: z
    .object({
      address: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
      latitude: z.number().describe("Lattitude provenant de la BAN ou du partenaire"),
      longitude: z.number().describe("Longitude provenant de la BAN ou du partenaire"),
    })
    .describe("Adresse définit par le SIRET ou transmise par le partenaire (tous les champs sont obligatoire)"),
  domaine: z.object({
    idcc: z.number().nullable().describe("Identifiant convention collective"),
    opco: z.string().nullable().describe("Nom de l'OPCO"),
    naf: z.object({
      code: z.string().nullable().describe("code NAF"),
      label: z.string().nullable().describe("Libelle NAF"),
    }),
  }),
})

export const ZJobsPartners = z.object({
  _id: zObjectId,
  raw_id: z.string().describe("Identifiant d'origine l'offre provenant du partenaire"),
  partner_label: extensions.buildEnum(JOBPARTNERS_LABEL).describe("Référence du partenaire"),
  contract: ZJobsPartnersContract.nullable(),
  job_offer: ZJobsPartnersJobOffer.nullable(),
  workplace: ZJobsPartnersWorkplace,
  apply: ZJobsPartnersApply,
})
export type IJobsPartners = z.output<typeof ZJobsPartners>

/**
 * RECRUTEURS_LBA comes from recruteurslba collection, not from JobsPartners
 */
export const ZJobsPartnersRecruteurLba = ZJobsPartners.omit({ _id: true, partner_label: true }).extend({ _id: z.null(), partner_label: z.literal(LBA_JOB_TYPE.RECRUTEURS_LBA) })
export type IJobsPartnersRecruteurLba = z.output<typeof ZJobsPartnersRecruteurLba>

/**
 * OFFRES_EMPLOI_LBA comes from JobsPartners (API) AND RECRUITERS
 */
export const ZJobsPartnersOffresEmploiLba = ZJobsPartners.omit({ _id: true }).extend({ _id: zObjectId.nullable(), partner_label: z.literal(LBA_JOB_TYPE.OFFRES_EMPLOI_LBA) })
export type IJobsPartnersOffresEmploiLba = z.output<typeof ZJobsPartnersOffresEmploiLba>

/**
 * OFFRES_EMPLOI_FRANCE_TRAVAIL
 */
export const ZJobsPartnersOffresEmploiFranceTravail = ZJobsPartners.omit({ _id: true }).extend({
  _id: z.null(),
  partner_label: z.literal(LBA_JOB_TYPE.OFFRES_EMPLOI_FRANCE_TRAVAIL),
})
export type IJobsPartnersOffresEmploiFranceTravail = z.output<typeof ZJobsPartnersOffresEmploiFranceTravail>

export default {
  zod: ZJobsPartners,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor

import { z } from "zod"

import { NIVEAUX_POUR_LBA, TRAINING_CONTRACT_TYPE } from "../constants"
import { extensions } from "../helpers/zodHelpers/zodPrimitives"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "jobs_partners" as const

enum JOBPARTNERS_LABEL {
  HELLOWORK = "hellowork",
  IMILO = "i-milo",
  MISSIONLOCALE = "mission-locale",
}

const ZJobsPartnersApply = z.object({
  url: z.string().nullable().describe("URL pour candidater"),
  email: z.string().nullable().describe("Email de contact"),
  phone: z.string().nullable().describe("Téléphone de contact"),
})

const ZJobsPartnersContract = z.object({
  start: z.date().nullable().describe("Date de début de contrat"),
  type: extensions.buildEnum(TRAINING_CONTRACT_TYPE).describe("type de contract, formaté à l'insertion"),
  duration: z.string().nullable().describe("Durée du contract"),
})

const ZJobsPartnersJobOffer = z.object({
  origin: z.string().describe("Origine de l'offre (nom de la source)"),
  rome_code: z.string().describe("Code rome de l'offre"),
  title: z.string().describe("Titre de l'offre"),
  description: z.string().describe("description de l'offre, soit définit par le partenaire, soit celle du ROME si pas suffisament grande"),
  desired_skills: z.string().describe("Compétence attendues par le candidat pour l'offre"),
  acquired_skills: z.string().describe("Compétence acuqises durant l'alternance"),
  access_condition: z.string().describe("Conditions d'accès à l'offre"),
  diploma_level_label: extensions.buildEnum(NIVEAUX_POUR_LBA).describe("Niveau de diplome visé en fin d'étude, transformé pour chaque partenaire"),
  remote: extensions.buildEnum("").describe("Format de travail de l'offre"), //use from jobOpportunity PR
  publication: z.object({
    creation_date: z.date().describe("Date de creation de l'offre"),
    expiration_date: z.date().describe("Date d'expiration de l'offre. Si pas présente, mettre àcreation_date + 60j"),
  }),
  meta: z.object({
    count: z.number().describe("Nombre de poste disponible"),
    multicast: z.boolean().default(true).describe("Si l'offre peut être diffusé sur l'ensemble des plateformes partenaires"),
  }),
})

const ZJobsPartnersWorkplace = z.object({
  siret: extensions.siret.nullable().describe("Siret de l'entreprise"),
  website: z.string().nullable().describe("Site web de l'entreprise"),
  raison_sociale: z.string().describe("Raison sociale"),
  enseigne: z.string().nullable().describe("Enseigne de l'entreprise"),
  name: z.string().nullable().describe("Nom customisé de l'entreprise"),
  description: z.string().nullable().describe("description de l'entreprise"),
  size: z.string().nullable().describe("Taille de l'entreprise"),
  custom_size: z.string(), // USELESS
  location: z
    .object({
      address: z.string().describe("Adresse de l'offre, provenant du SIRET ou du partenaire"),
      lattitude: z.number().describe("Lattitude provenant de la BAN ou du partenaire"),
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

const ZJobsPartners = z.object({
  _id: zObjectId,
  raw_id: z.string().describe("Identifiant d'origine l'offre provenant du partenaire"),
  partner_label: extensions.buildEnum(JOBPARTNERS_LABEL).describe("Référence du partenaire"),
  contract: ZJobsPartnersContract,
  jobOffer: ZJobsPartnersJobOffer,
  workplace: ZJobsPartnersWorkplace,
  apply: ZJobsPartnersApply,
})

export default {
  zod: ZJobsPartners,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor

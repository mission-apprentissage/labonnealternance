import { z } from "zod"

import { IModelDescriptor, zObjectId } from "./common"

const ZFTContact = z.object({
  nom: z.string(),
  courriel: z.string(),
  coordonnees1: z.string(),
  coordonnees2: z.string(),
  coordonnees3: z.string(),
})

export type IFTContact = z.output<typeof ZFTContact>

const ZFTEntreprise = z.object({
  nom: z.string(),
  logo: z.string().optional(),
  description: z.string(),
  siret: z.string().optional(),
  entrepriseAdaptee: z.boolean().optional(),
})
export type IFTEntreprise = z.output<typeof ZFTEntreprise>

const ZFTFormation = z.object({
  codeFormatio: z.string(),
  domaineLibelle: z.string(),
  niveauLibelle: z.string(),
  exigence: z.string(),
})
export type IFTFormation = z.output<typeof ZFTFormation>

const ZFTPartenaire = z.object({
  nom: z.string(),
  url: z.string(),
  logo: z.string(),
})
export type IFTPartenaire = z.output<typeof ZFTPartenaire>

const ZFTOrigineOffre = z.object({
  origine: z.string(),
  urlOrigine: z.string(),
  partenaires: z.array(ZFTPartenaire),
})
export type IFTOrigineOffre = z.output<typeof ZFTOrigineOffre>

const ZFTJob = z
  .object({
    _id: zObjectId,
    createdAt: z.date(),

    id: z.string(),
    intitule: z.string(),
    description: z.string(),
    dateCreation: z.string(),
    dateActualisation: z.string(),
    lieuTravail: z.object({
      libelle: z.string(),
      latitude: z.string().optional(),
      longitude: z.string().optional(),
      codePostal: z.string().optional(),
      commune: z.string().optional(),
    }),
    romeCode: z.string(),
    romeLibelle: z.string(),
    appellationlibelle: z.string(),
    entreprise: ZFTEntreprise,
    typeContrat: z.string(),
    typeContratLibelle: z.string(),
    natureContrat: z.string(),
    experienceExige: z.string(),
    experienceLibelle: z.string(),
    competences: z.array(z.object({}).passthrough()).optional(),
    permis: z.array(z.object({}).passthrough()).optional(),
    salaire: z.union([z.array(z.object({}).passthrough()), z.object({}).passthrough()]),
    dureeTravailLibelle: z.string().optional(),
    dureeTravailLibelleConverti: z.string().optional(),
    alternance: z.boolean(),
    contact: ZFTContact.optional(),
    agence: z.union([z.array(z.object({}).passthrough()), z.object({}).passthrough()]),
    nombrePostes: z.number(),
    accessibleTH: z.boolean(),
    deplacementCode: z.string().optional(),
    deplacementLibelle: z.string().optional(),
    qualificationCode: z.string().optional(),
    qualificationLibelle: z.string().optional(),
    codeNAF: z.string().optional(),
    secteurActivite: z.string().optional(),
    secteurActiviteLibelle: z.string().optional(),
    qualitesProfessionnelles: z.array(z.object({}).passthrough()).optional(),
    origineOffre: ZFTOrigineOffre,
    offresManqueCandidats: z.boolean().optional(),
    formations: z.array(ZFTFormation).optional(),
    langues: z.array(z.object({}).passthrough()).optional(),
    complementExercice: z.string().optional(),
    appellationLibelle: z.string(),
  })
  .passthrough()

export type IFTJob = z.output<typeof ZFTJob>

export default {
  zod: ZFTJob,
  indexes: [],
  collectionName: "raw_francetravail",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor

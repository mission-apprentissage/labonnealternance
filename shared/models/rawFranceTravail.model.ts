import { z } from "zod"

import { IModelDescriptor, zObjectId } from "./common.js"

const ZFTContact = z.object({
  nom: z.string().optional(),
  courriel: z.string().optional(),
  telephone: z.string().optional(),
  urlPostulation: z.string().optional(),
  coordonnees1: z.string().optional(),
  coordonnees2: z.string().optional(),
  coordonnees3: z.string().optional(),
})

export type IFTContact = z.output<typeof ZFTContact>

const ZFTEntreprise = z.object({
  nom: z.string().optional(),
  url: z.string().optional(),
  logo: z.string().optional(),
  description: z.string().optional(),
  siret: z.string().optional(),
  entrepriseAdaptee: z.boolean().optional(),
})
export type IFTEntreprise = z.output<typeof ZFTEntreprise>

const ZFTFormation = z.object({
  codeFormation: z.string().optional(),
  domaineLibelle: z.string().optional(),
  niveauLibelle: z.string().optional(),
  exigence: z.string().optional(),
  commentaire: z.string().optional(),
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
  partenaires: z.array(ZFTPartenaire).optional(),
})
export type IFTOrigineOffre = z.output<typeof ZFTOrigineOffre>

export const ZFTJobRaw = z
  .object({
    _id: zObjectId,
    createdAt: z.date(),
    updatedAt: z.date(),
    unpublishedAt: z.date().optional(),

    id: z.string(),
    intitule: z.string(),
    description: z.string(),
    dateCreation: z.string(),
    dateActualisation: z.string(),
    lieuTravail: z.object({
      libelle: z.string(),
      latitude: z.number().optional(),
      longitude: z.number().optional(),
      codePostal: z.string().optional(),
      commune: z.string().optional(),
    }),
    romeCode: z.string(),
    romeLibelle: z.string(),
    appellationlibelle: z.string().optional(),
    entreprise: ZFTEntreprise,
    typeContrat: z.string(),
    typeContratLibelle: z.string(),
    natureContrat: z.string(),
    experienceExige: z.string(),
    experienceLibelle: z.string(),
    competences: z.array(z.object({ code: z.string(), libelle: z.string(), exigence: z.string() }).passthrough()).optional(),
    permis: z.array(z.object({}).passthrough()).optional(),
    salaire: z.union([z.array(z.object({}).passthrough()), z.object({}).passthrough()]),
    dureeTravailLibelle: z.string().optional(),
    dureeTravailLibelleConverti: z.string().optional(),
    alternance: z.boolean(),
    contact: ZFTContact.optional(),
    agence: z.union([z.array(z.object({}).passthrough()), z.object({}).passthrough()]).optional(),
    nombrePostes: z.number().optional(),
    accessibleTH: z.boolean().optional(),
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
    _metadata: z
      .object({
        openai: z
          .object({
            type: z.enum(["entreprise", "cfa", "entreprise_cfa"]),
            cfa: z.string().optional(),
            human_verification: z.enum(["entreprise", "cfa", "entreprise_cfa"]).optional(),
          })
          .optional(),
      })
      .passthrough()
      .optional(),
  })
  .passthrough()

export type IFTJobRaw = z.output<typeof ZFTJobRaw>

export default {
  zod: ZFTJobRaw,
  indexes: [],
  collectionName: "raw_francetravail",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor

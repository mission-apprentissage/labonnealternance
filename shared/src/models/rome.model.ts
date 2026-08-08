import type { Jsonify } from "type-fest"
import { z } from "../helpers/zodWithOpenApi.js"
import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const ZRome = z.strictObject({
  code_rome: z.string(),
  intitule: z.string(),
  code_ogr: z.string(),
})

const ZRomeAppellation = z.strictObject({
  libelle: z.string(),
  libelle_court: z.string(),
  code_ogr: z.string(),
})

const ZRomeItem = z.strictObject({
  libelle: z.string(),
  code_ogr: z.string(),
})

const ZRomeSavoir = z.strictObject({
  libelle: z.string(),
  code_ogr: z.string(),
  coeur_metier: z.string().nullish(),
})

export const ZRomeCategorieSavoir = z.strictObject({
  libelle: z.string(),
  items: z.array(ZRomeSavoir),
})

export const ZRomeCompetence = z.strictObject({
  savoir_faire: z.array(ZRomeCategorieSavoir).nullish(),
  savoir_etre_professionnel: z.array(ZRomeSavoir).nullish(),
  savoirs: z.array(ZRomeCategorieSavoir).nullish(),
})

const ZRomeContextesTravail = z.strictObject({
  libelle: z.string(),
  items: z.array(ZRomeItem),
})

const ZRomeMobilite = z.strictObject({
  rome_cible: z.string(),
  code_org_rome_cible: z.string(),
  ordre_mobilite: z.string(),
})

export const ZReferentielRomeForJob = z.strictObject({
  numero: z.string(),
  rome: ZRome,
  appellations: z.array(ZRomeAppellation),
  definition: z.string(),
  acces_metier: z.string(),
  competences: ZRomeCompetence,
  competencesDeBase: z.array(ZRomeCategorieSavoir).nullish(), //TODO: remove when 1j1s switch to api V2
  contextes_travail: z.array(ZRomeContextesTravail).nullish(),
  mobilites: z.array(ZRomeMobilite).nullish(),
})

export type IRome = z.output<typeof ZRome>
export type IRomeMobilite = z.output<typeof ZRomeMobilite>

export const ZReferentielRome = ZReferentielRomeForJob.extend({
  _id: zObjectId,
  couple_appellation_rome: z
    .array(
      z.object({
        code_rome: z.string(),
        intitule: z.string(),
        appellation: z.string(),
      })
    )
    .describe("Champ retourné lors de la recherche métier à la creation d'offre"),
})

export type IReferentielRome = z.output<typeof ZReferentielRome>
export type IReferentielRomeForJob = z.output<typeof ZReferentielRomeForJob>
export type IReferentielRomeForJobJson = Jsonify<IReferentielRomeForJob>

export default {
  zod: ZReferentielRome,
  indexes: [[{ "rome.code_rome": 1 }, {}]],
  collectionName: "referentielromes" as const,
} as const satisfies IModelDescriptor

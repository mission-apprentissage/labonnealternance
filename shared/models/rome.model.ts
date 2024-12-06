import { IModelDescriptor, zObjectId } from "shared/models/common"

import { z } from "../helpers/zodWithOpenApi"

const ZRome = z
  .object({
    code_rome: z.string(),
    intitule: z.string(),
    code_ogr: z.string(),
  })
  .strict()

const ZRomeAppellation = z
  .object({
    libelle: z.string(),
    libelle_court: z.string(),
    code_ogr: z.string(),
  })
  .strict()

const ZRomeItem = z
  .object({
    libelle: z.string(),
    code_ogr: z.string(),
  })
  .strict()

const ZRomeSavoir = z
  .object({
    libelle: z.string(),
    code_ogr: z.string(),
    coeur_metier: z.string().nullish(),
  })
  .strict()

export const ZRomeCategorieSavoir = z
  .object({
    libelle: z.string(),
    items: z.array(ZRomeSavoir),
  })
  .strict()

export const ZRomeCompetence = z
  .object({
    savoir_faire: z.array(ZRomeCategorieSavoir).nullish(),
    savoir_etre_professionnel: z.array(ZRomeSavoir).nullish(),
    savoirs: z.array(ZRomeCategorieSavoir).nullish(),
  })
  .strict()

const ZRomeContextesTravail = z
  .object({
    libelle: z.string(),
    items: z.array(ZRomeItem),
  })
  .strict()

const ZRomeMobilite = z
  .object({
    rome_cible: z.string(),
    code_org_rome_cible: z.string(),
    ordre_mobilite: z.string(),
  })
  .strict()

export const ZReferentielRomeForJob = z
  .object({
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
  .strict()

export type IRome = z.output<typeof ZRome>
export type IRomeMobilite = z.output<typeof ZRomeMobilite>

export const ZReferentielRome = ZReferentielRomeForJob.extend({
  _id: zObjectId,
})

export type IReferentielRome = z.output<typeof ZReferentielRome>
export type IReferentielRomeForJob = z.output<typeof ZReferentielRomeForJob>

export default {
  zod: ZReferentielRome,
  indexes: [[{ "rome.code_rome": 1 }, {}]],
  collectionName: "referentielromes" as const,
} as const satisfies IModelDescriptor

import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

const collectionName = "domainesmetiers" as const

export const ZDomainesMetiers = z
  .object({
    _id: zObjectId.nullish(),
    sous_domaine: z.string(),
    sous_domaine_sans_accent_computed: z.string(),
    domaine: z.string(),
    domaine_sans_accent_computed: z.string(),
    codes_romes: z.array(z.string()),
    intitules_romes: z.array(z.string()),
    intitules_romes_sans_accent_computed: z.array(z.string()),
    codes_rncps: z.array(z.string()),
    intitules_rncps: z.array(z.string()),
    intitules_rncps_sans_accent_computed: z.array(z.string()),
    mots_clefs: z.string(),
    mots_clefs_sans_accent_computed: z.string(),
    mots_clefs_specifiques: z.string(),
    mots_clefs_specifiques_sans_accent_computed: z.string(),
    appellations_romes: z.string(),
    appellations_romes_sans_accent_computed: z.string(),
    codes_fap: z.array(z.string()),
    intitules_fap: z.array(z.string()),
    intitules_fap_sans_accent_computed: z.array(z.string()),
    sous_domaine_onisep: z.array(z.string()),
    sous_domaine_onisep_sans_accent_computed: z.array(z.string()),
    couples_appellations_rome_metier: z.array(
      z
        .object({
          codeRome: z.string(),
          intitule: z.string(),
          appellation: z.string(),
        })
        .strict()
    ),
    couples_romes_metiers: z.array(
      z
        .object({
          codeRome: z.string(),
          intitule: z.string(),
        })
        .strict()
    ),
    created_at: z.date(),
    last_update_at: z.date(),
  })
  .strict()

export type IDomainesMetiers = z.output<typeof ZDomainesMetiers>

export default {
  zod: ZDomainesMetiers,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor

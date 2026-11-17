import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "referentiel_rome_naf" as const

export const ZReferentielRomeNafContratsParAnnee = z.array(
  z.strictObject({
    annee: z.number().int().min(2000).max(2100),
    n_contrats: z.number().int().nonnegative(),
  })
)

// Secteurs (NAF) qui recrutent en alternance sur un métier (ROME), alimenté chaque semaine par l'équipe data
// depuis le fichier S3 cross_naf/naf_par_rome.json (#5440). `rang` 1 désigne le couple le plus pertinent pour le ROME.
export const ZReferentielRomeNaf = z.strictObject({
  _id: zObjectId,
  rome: z.string(),
  rome_libelle: z.string(),
  naf: z.string().describe("code NAF au format INSEE (01.61Z), cf. normalizeNafCode"),
  naf_libelle: z.string(),
  rang: z.number().int().positive(),
  contrats_par_annee: ZReferentielRomeNafContratsParAnnee,
  created_at: z.date(),
  updated_at: z.date(),
})

export type IReferentielRomeNaf = z.output<typeof ZReferentielRomeNaf>

export default {
  zod: ZReferentielRomeNaf,
  indexes: [
    [{ rome: 1, naf: 1 }, { unique: true }],
    [{ rome: 1, rang: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

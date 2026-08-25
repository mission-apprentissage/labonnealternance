import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "deca_contrats" as const

// Plage plausible pour une année de contrat DECA : suffisamment large pour couvrir l'historique
// et quelques années futures, sans laisser passer une clé aberrante (ex: un total mal placé).
const MIN_VALID_YEAR = 2000
const MAX_VALID_YEAR = 2100

const ZContratsParAnnee = z.record(
  z
    .string()
    .regex(/^\d{4}$/, "l'année doit être une chaîne à 4 chiffres")
    .refine((year) => Number(year) >= MIN_VALID_YEAR && Number(year) <= MAX_VALID_YEAR, `l'année doit être comprise entre ${MIN_VALID_YEAR} et ${MAX_VALID_YEAR}`),
  z.number().int().nonnegative()
)

// Référentiel DECA (Dépôt des Contrats d'Alternance) : nombre de contrats d'alternance par SIRET et par année,
// alimenté depuis le fichier S3 siretlist/lba_deca_contrats_par_annee.ndjson
// (ex. { "siret": "00552017600016", "contrats_par_annee": { "2023": 2 } })
export const ZDecaContrats = z.strictObject({
  _id: zObjectId,
  siret: z.string(),
  contrats_par_annee: ZContratsParAnnee,
  created_at: z.date(),
  updated_at: z.date(),
})

export type IDecaContrats = z.output<typeof ZDecaContrats>

export default {
  zod: ZDecaContrats,
  indexes: [[{ siret: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor

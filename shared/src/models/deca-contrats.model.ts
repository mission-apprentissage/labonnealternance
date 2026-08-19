import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "deca_contrats" as const

// Référentiel DECA (Dépôt des Contrats d'Alternance) : nombre de contrats d'alternance par SIRET et par année,
// alimenté depuis le fichier S3 siretlist/lba_deca_contrats_par_annee.ndjson
// (ex. { "siret": "00552017600016", "contrats_par_annee": { "2023": 2 } })
export const ZDecaContrats = z.strictObject({
  _id: zObjectId,
  siret: z.string(),
  contrats_par_annee: z.record(z.string(), z.number()),
  created_at: z.date(),
  updated_at: z.date(),
})

export type IDecaContrats = z.output<typeof ZDecaContrats>

export default {
  zod: ZDecaContrats,
  indexes: [[{ siret: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor

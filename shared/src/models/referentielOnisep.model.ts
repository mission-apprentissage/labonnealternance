import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "referentieloniseps" as const

export const ZReferentielOnisep = z
  .object({
    _id: zObjectId,
    id_action_ideo2: z.string(),
    cle_ministere_educatif: z.string(),
    created_at: z.coerce.date(),
  })
  .strict()

export type IReferentielOnisep = z.output<typeof ZReferentielOnisep>

export default {
  zod: ZReferentielOnisep,
  indexes: [[{ id_action_ideo2: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor

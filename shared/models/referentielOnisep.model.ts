import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZReferentielOnisep = z
  .object({
    _id: zObjectId,
    id_action_ideo2: z.string(),
    cle_ministere_educatif: z.string(),
    created_at: z.coerce.date(),
  })
  .strict()

export type IReferentielOnisep = z.output<typeof ZReferentielOnisep>

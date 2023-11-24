import { z } from "../helpers/zodWithOpenApi"

export const ZReferentielOnisep = z
  .object({
    id_action_ideo2: z.string(),
    cle_ministere_educatif: z.string(),
    created_at: z.coerce.date(),
  })
  .strict()

export type IReferentielOnisep = z.output<typeof ZReferentielOnisep>

import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZCustomEmailETFA = z
  .object({
    _id: zObjectId,
    email: z.string(),
    cle_ministere_educatif: z.string(),
  })
  .strict()

export type ICustomEmailETFA = z.output<typeof ZCustomEmailETFA>

import { EDiffusibleStatus } from "../constants/diffusibleStatus"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

export const ZSiretDiffusibleStatus = z
  .object({
    _id: zObjectId,
    siret: z.string(),
    status_diffusion: z.enum([Object.values(EDiffusibleStatus)[0], ...Object.values(EDiffusibleStatus).slice(1)]),
    creation_date: z.coerce.date(),
    last_update_date: z.coerce.date(),
  })
  .strict()

export type ISiretDiffusibleStatus = z.output<typeof ZSiretDiffusibleStatus>

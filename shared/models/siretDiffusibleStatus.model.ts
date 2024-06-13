import { EDiffusibleStatus } from "../constants/diffusibleStatus"
import { z } from "../helpers/zodWithOpenApi"

import { IModelDescriptor, zObjectId } from "./common"

export const ZSiretDiffusibleStatus = z
  .object({
    _id: zObjectId,
    siret: z.string(),
    status_diffusion: z.enum([Object.values(EDiffusibleStatus)[0], ...Object.values(EDiffusibleStatus).slice(1)]).default(EDiffusibleStatus.DIFFUSIBLE),
    created_at: z.coerce.date(),
    last_update_at: z.coerce.date(),
  })
  .strict()

export type ISiretDiffusibleStatus = z.output<typeof ZSiretDiffusibleStatus>

export default {
  zod: ZSiretDiffusibleStatus,
  indexes: [[{ siret: 1 }, { unique: true }]],
  collectionName: "siretdiffusiblestatuses" as const,
} as const satisfies IModelDescriptor

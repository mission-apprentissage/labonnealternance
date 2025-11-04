import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor} from "./common.js";
import { zObjectId } from "./common.js"

const collectionName = "customemailetfas" as const

export const ZCustomEmailETFA = z
  .object({
    _id: zObjectId,
    email: z.string(),
    cle_ministere_educatif: z.string(),
  })
  .strict()

export type ICustomEmailETFA = z.output<typeof ZCustomEmailETFA>

export default {
  zod: ZCustomEmailETFA,
  indexes: [[{ cle_ministere_educatif: 1 }, {}]],
  collectionName,
} as const satisfies IModelDescriptor

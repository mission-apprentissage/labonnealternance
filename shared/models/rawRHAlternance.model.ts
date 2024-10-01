import { z } from "zod"

import { IModelDescriptor } from "./common"

export const ZRawRHAlternance = z.object({
  createdAt: z.date(),
  job: z.unknown(),
})

export type IRawRHAlternance = z.output<typeof ZRawRHAlternance>

export default {
  zod: ZRawRHAlternance,
  indexes: [],
  collectionName: "raw_rhalternance",
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor

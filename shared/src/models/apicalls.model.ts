import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "apicalls" as const

export const ZApiCall = z.strictObject({
  _id: zObjectId,
  caller: z.string(),
  api_path: z.string(),
  response: z.string(),
  result_count: z.number(),
  job_count: z.number(),
  training_count: z.number(),
  created_at: z.date(),
})

export type IApiCall = z.output<typeof ZApiCall>

export default {
  zod: ZApiCall,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor

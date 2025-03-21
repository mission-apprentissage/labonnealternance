import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "apicalls" as const

export const ZApiCall = z
  .object({
    _id: zObjectId,
    caller: z.string(),
    api_path: z.string(),
    response: z.string(),
    result_count: z.number(),
    job_count: z.number(),
    training_count: z.number(),
    created_at: z.date(),
  })
  .strict()

export type IApiCall = z.output<typeof ZApiCall>

export default {
  zod: ZApiCall,
  indexes: [],
  collectionName,
} as const satisfies IModelDescriptor

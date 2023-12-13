import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"

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

export const ZApiCallNew = ZApiCall.omit({
  _id: true,
  created_at: true,
})

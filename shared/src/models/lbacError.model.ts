import { MAX_SEARCH_ROMES } from "../constants/search.js"
import { z } from "../helpers/zodWithOpenApi.js"

export const ZLbacError = z.strictObject({
  error: z.string(),
  error_messages: z
    .array(z.string())

    .nullish(),
})

export const ZApiError = z.strictObject({
  result: z.string().optional(),
  error: z.string(),
  message: z.any().optional(),
  status: z.number().optional(),
  statusText: z.string().optional(),
  error_messages: z
    .array(z.string())

    .nullish(),
})

export const ZLbarError = z.strictObject({
  error: z.boolean(),
  message: z.string(),
})

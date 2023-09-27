import { z } from "zod"

export const ZLbacError = z.object({
  error: z.string().nullish(),
  error_messages: z.array(z.string()).nullish(),
})

export const ZApiError = z
  .object({
    result: z.string().optional(),
    error: z.string(),
    message: z.any().optional(),
    status: z.number().optional(),
    statusText: z.string().optional(),
  })
  .strict()

export const ZLbarError = z.object({
  error: z.boolean(),
  message: z.string(),
})

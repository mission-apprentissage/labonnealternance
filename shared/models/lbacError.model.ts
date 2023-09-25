import { z } from "zod"

export const ZLbacError = z.object({
  error: z.string().nullish(),
  error_messages: z.array(z.string()).nullish(),
})

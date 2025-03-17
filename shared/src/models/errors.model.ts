import { BusinessErrorCodes } from "../constants/errorCodes.js"
import { z } from "../helpers/zodWithOpenApi.js"

const businessErrorCodeValues = Object.values(BusinessErrorCodes)

export const ZBusinessError = z
  .object({
    error: z.literal(true),
    message: z.string(),
    errorCode: z.enum([businessErrorCodeValues[0], ...businessErrorCodeValues.slice(1)]).optional(),
  })
  .strict()

export type IBusinessError = z.output<typeof ZBusinessError>

import { z } from "../helpers/zodWithOpenApi.js"

export const ZLbacError = z
  .object({
    error: z.string().openapi({
      description: "Le type générique de l'erreur",
      example: "wrong_parameters",
    }),
    error_messages: z
      .array(z.string())
      .openapi({
        description: "Une liste d'erreurs détaillées. Ex : les erreurs de paramétrage de la requête.",
        example: ["romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234", "romes : Too many rome codes. Maximum is 20."],
      })
      .nullish(),
  })
  .strict()
  .openapi("LbacError")

export const ZApiError = z
  .object({
    result: z.string().optional(),
    error: z.string(),
    message: z.any().optional(),
    status: z.number().optional(),
    statusText: z.string().optional(),
    error_messages: z
      .array(z.string())
      .openapi({
        description: "Une liste d'erreurs détaillées. Ex : les erreurs de paramétrage de la requête.",
        example: ["romes : Badly formatted rome codes. Rome code must be one letter followed by 4 digit number. ex : A1234", "romes : Too many rome codes. Maximum is 20."],
      })
      .nullish(),
  })
  .strict()
  .openapi("ApiError")

export const ZLbarError = z
  .object({
    error: z.boolean(),
    message: z.string(),
  })
  .strict()
  .openapi("ZLbarError")

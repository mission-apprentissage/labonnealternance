import { z } from "zod"

export const ZRomeWithLabel = z
  .object({
    label: z.string(),
    intitule: z.string(),
  })
  .strict()

export const ZMetierEnrichi = z
  .object({
    label: z.string(),
    romes: z.string().array(),
    rncps: z.string().array().nullish().optional(),
    type: z.string().nullish().optional(),
    romeTitles: ZRomeWithLabel.array().nullish().optional(),
  })
  .strict()

export const ZMetiers = z.object({ metiers: z.string().array() }).strict()

export const ZAppellationRome = z
  .object({
    codeRome: z.string(),
    intitule: z.string(),
    appellation: z.string(),
  })
  .strict()

export const ZAppellationsRomes = z
  .object({
    coupleAppellationRomeMetier: ZAppellationRome.array(),
  })
  .strict()

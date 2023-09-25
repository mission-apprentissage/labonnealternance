import { z } from "zod"

export const ZRomeWithLabel = z.object({
  label: z.string(),
  intitule: z.string(),
})

export const ZMetierEnrichi = z.object({
  label: z.string(),
  romes: z.string().array(),
  rncps: z.string().array().nullish(),
  type: z.string().nullish(),
  romeTitles: ZRomeWithLabel.array().nullish(),
})

export const ZMetiersEnrichis = z.object({
  labelsAndRomes: ZMetierEnrichi.array(),
  labelsAndRomesForDiplomas: ZMetierEnrichi.array(),
})

export const ZMetiers = z.object({ metiers: z.string().array() })

export const ZAppellationRome = z.object({
  codeRome: z.string(),
  intitule: z.string(),
  appellation: z.string(),
})

export const ZAppellationsRomes = z.object({
  coupleAppellationRomeMetier: ZAppellationRome.array(),
})

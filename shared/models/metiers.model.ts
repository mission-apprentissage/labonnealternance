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

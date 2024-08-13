import { z } from "zod"

const ZRomeo = z.object({
  contexte: z.string(),
  identifiant: z.string(),
  intitule: z.string(),
  uuidInference: z.string(),
  metiersRome: z.array(
    z.object({
      codeAppellation: z.string(),
      codeRome: z.string(),
      libelleAppellation: z.string(),
      libelleRome: z.string(),
      scorePrediction: z.number(),
    })
  ),
})

export const ZRomeoApiResponse = z.array(ZRomeo)
export type IRomeoApiResponse = z.output<typeof ZRomeoApiResponse>

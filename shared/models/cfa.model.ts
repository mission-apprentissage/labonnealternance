import { z } from "zod"

export const zCFA = z
  .object({
    establishment_state: z.string(),
    is_qualiopi: z.string(),
    establishment_siret: z.string(),
    establishment_raison_sociale: z.string(),
    contacts: z.string(),
    address_detail: z.string(),
    address: z.string(),
    geo_coordinates: z.string(),
  })
  .strict()

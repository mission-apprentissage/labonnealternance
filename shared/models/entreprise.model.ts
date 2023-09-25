import { z } from "zod"

export const zEntreprise = z
  .object({
    establishment_enseigne: z.string().nullish(),
    establishment_state: z.string(), // F pour fermé ou A pour actif
    establishment_siret: z.string().nullish(),
    establishment_raison_sociale: z.string().nullish(),
    address_detail: z.any(),
    address: z.string().nullish(),
    contacts: z.array(z.any()), // conserve la coherence avec l'UI
    naf_code: z.string().nullish(),
    naf_label: z.string().nullish(),
    establishment_size: z.string().nullish(),
    establishment_creation_date: z.date().nullish(),
    geo_coordinates: z.string(),
  })
  .strict()

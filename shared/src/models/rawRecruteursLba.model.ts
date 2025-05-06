import { z } from "zod"

import { IModelDescriptor, zObjectId } from "./common.js"

export const ZRecruteursLbaRaw = z.object({
  _id: zObjectId,
  createdAt: z.date(),
  siret: z.string(),
  enseigne: z.string(),
  activitePrincipaleEtablissement: z.string(),
  labelActivitePrincipaleEtablissement: z.string(),
  raison_sociale: z.string().nullable(),
  street_number: z.string().nullable(),
  street_name: z.string().nullable(),
  insee_city_code: z.string().nullable(),
  zip_code: z.string().nullable(),
  email: z.string().nullable(),
  phone: z.string().nullable(),
  company_size: z.string(),
  libelleCommuneEtablissement: z.string().nullable(),
  coordonneeLambertAbscisseEtablissement: z.number().nullable(),
  coordonneeLambertOrdonneeEtablissement: z.number().nullable(),
  rome_codes: z.array(z.object({ rome_code: z.string(), normalized_score: z.number() })),
})
export type IRecruteursLbaRaw = z.output<typeof ZRecruteursLbaRaw>

export default {
  zod: ZRecruteursLbaRaw,
  indexes: [[{ siret: 1 }, {}]],
  collectionName: "raw_recruteurslba",
} as const satisfies IModelDescriptor

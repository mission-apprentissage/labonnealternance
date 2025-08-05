import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "referentiel_engagement_entreprise" as const

export const ZReferentielEngagementEntreprise = z
  .object({
    _id: zObjectId,
    siret: z.string(),
    engagement: z.enum(["handicap"]),
    sources: z.array(z.string()),
  })
  .strict()

export type IReferentielEngagementEntreprise = z.output<typeof ZReferentielEngagementEntreprise>

export default {
  zod: ZReferentielEngagementEntreprise,
  indexes: [[{ siret: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor

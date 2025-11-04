import { z } from "../helpers/zodWithOpenApi.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "referentiel_engagement_entreprise" as const

export enum EntrepriseEngagementSources {
  FRANCE_TRAVAIL = "france-travail",
  LBA = "lba",
  LES_ENTREPRISE_S_ENGAGENT = "les",
}

export const ZReferentielEngagementEntreprise = z
  .object({
    _id: zObjectId,
    siret: z.string(),
    engagement: z.enum(["handicap"]),
    sources: z.array(z.enum([EntrepriseEngagementSources.FRANCE_TRAVAIL, EntrepriseEngagementSources.LBA, EntrepriseEngagementSources.LES_ENTREPRISE_S_ENGAGENT])),
    created_at: z.date(),
    updated_at: z.date(),
  })
  .strict()

export type IReferentielEngagementEntreprise = z.output<typeof ZReferentielEngagementEntreprise>

export default {
  zod: ZReferentielEngagementEntreprise,
  indexes: [
    [{ siret: 1 }, { unique: true }],
    [{ engagement: 1 }, {}],
    [{ sources: 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

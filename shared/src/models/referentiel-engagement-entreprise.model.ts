import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "referentiel_engagement_entreprise" as const

export enum EntrepriseEngagementSources {
  FRANCE_TRAVAIL = "france-travail",
  LBA = "lba",
  LES_ENTREPRISE_S_ENGAGENT = "les",
}

// Choix de l'entreprise, lors de la création de compte, de valoriser (ou non) son engagement en faveur
// de l'emploi des personnes en situation de handicap. Cf. HandiEngagementSelect côté UI et
// updateEntrepriseHandiEngagement côté service, qui alimente ce référentiel (source LBA) sur "oui".
export const HANDI_ENGAGEMENT_OUI = "oui" as const
export const HANDI_ENGAGEMENT_NON = "non" as const
export const HANDI_ENGAGEMENT_VALUES = [HANDI_ENGAGEMENT_OUI, HANDI_ENGAGEMENT_NON] as const
export type HandiEngagement = (typeof HANDI_ENGAGEMENT_VALUES)[number]

export const ZReferentielEngagementEntreprise = z.strictObject({
  _id: zObjectId,
  siret: z.string(),
  engagement: z.enum(["handicap"]),
  sources: z.array(z.enum([EntrepriseEngagementSources.FRANCE_TRAVAIL, EntrepriseEngagementSources.LBA, EntrepriseEngagementSources.LES_ENTREPRISE_S_ENGAGENT])),
  created_at: z.date(),
  updated_at: z.date(),
})

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

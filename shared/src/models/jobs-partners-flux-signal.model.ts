import { z } from "zod"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

const collectionName = "jobs_partners_flux_signals" as const

const ZJobsPartnersFluxCheck = z.object({
  checked_at: z.date(),
  changed: z.boolean().describe("Contenu différent de celui du dernier import"),
  skipped: z.boolean().describe("Run sauté : ni raw, ni computed, ni annulations touchés"),
})

/**
 * Dernier signal de changement connu d'un flux partenaire (#5669), un document par partenaire.
 * Les validateurs (etag, last_modified, content_length) sont ceux annoncés par la source ; size et
 * sha256 sont mesurés sur le contenu téléchargé, seuls à faire foi.
 */
export const ZJobsPartnersFluxSignal = z.object({
  _id: zObjectId,
  partner_label: z.string(),
  etag: z.string().nullish(),
  last_modified: z.date().nullish(),
  content_length: z.number().nullish().describe("Taille annoncée par la source (compressée si le transport l'est)"),
  size: z.number().nullish().describe("Taille en octets du contenu téléchargé"),
  sha256: z.string().nullish(),
  validators_unreliable_at: z.date().nullish().describe("Contenu changé sous des validateurs identiques : la source n'est plus crue sans téléchargement"),
  changed_at: z.date().nullish(),
  imported_at: z.date().nullish(),
  offer_count: z.number().nullish().describe("Documents dans la collection raw après le dernier import"),
  checks: z.array(ZJobsPartnersFluxCheck).nullish().describe("Dernières vérifications, les plus récentes en fin de tableau"),
})

export type IJobsPartnersFluxSignal = z.output<typeof ZJobsPartnersFluxSignal>

export default {
  zod: ZJobsPartnersFluxSignal,
  indexes: [[{ partner_label: 1 }, { unique: true }]],
  collectionName,
} as const satisfies IModelDescriptor

import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

/** Nombre d'apparitions du bouton par formulaire et par jour (UTC), incrémenté à chaque affichage. */
export const ZFeedbackDisplayCount = z.object({
  _id: zObjectId,
  form_slug: z.string(),
  day: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  displays: z.number().int().nonnegative(),
})
export type IFeedbackDisplayCount = z.output<typeof ZFeedbackDisplayCount>

export default {
  zod: ZFeedbackDisplayCount,
  indexes: [[{ form_slug: 1, day: 1 }, { unique: true }]],
  collectionName: "feedback_display_counts" as const,
  // tolérant aux champs hors schéma jusqu'à la stabilisation du modèle, cf. feedback-form.model
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor

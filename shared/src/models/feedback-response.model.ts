import { z } from "../helpers/zod-with-open-api.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"
import { ZFeedbackPageContext } from "./feedback-display.model.js"

/**
 * Réponse à une question. Les choix sont toujours un tableau, un seul élément pour une note ou un
 * choix unique : les trois types à choix se comptent avec le même `$unwind`.
 */
export const ZFeedbackAnswer = z.union([
  z.object({ question_id: z.string(), choices: z.array(z.string()).min(1).max(12) }),
  z.object({ question_id: z.string(), text: z.string().trim().min(1).max(2000) }),
])
export type IFeedbackAnswer = z.output<typeof ZFeedbackAnswer>

export const FEEDBACK_RESPONSE_STATUS = ["in_progress", "completed"] as const

/**
 * Un parcours de questionnaire, anonyme : créé à l'ouverture du panneau, complété étape par étape.
 * Le contexte de page est recopié de l'affichage qui l'a déclenché, pour filtrer sans jointure.
 */
export const ZFeedbackResponse = ZFeedbackPageContext.extend({
  _id: zObjectId,
  form_slug: z.string(),
  display_id: zObjectId,
  status: z.enum(FEEDBACK_RESPONSE_STATUS),
  answers: z.array(ZFeedbackAnswer),
  skipped: z.array(z.string()),
  // secret remis au navigateur à l'ouverture, exigé pour toute mise à jour du parcours
  token: z.string(),
  created_at: z.coerce.date<Date>(),
  updated_at: z.coerce.date<Date>(),
  completed_at: z.coerce.date<Date>().nullable(),
})
export type IFeedbackResponse = z.output<typeof ZFeedbackResponse>

export default {
  zod: ZFeedbackResponse,
  indexes: [[{ form_slug: 1, created_at: -1 }, {}]],
  collectionName: "feedback_responses" as const,
  // tolérant aux champs hors schéma jusqu'à la stabilisation du modèle, cf. feedback-form.model
  authorizeAdditionalProperties: true,
} as const satisfies IModelDescriptor

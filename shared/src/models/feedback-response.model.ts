import type { Jsonify } from "type-fest"

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

/** Nombre de commentaires rapportés au plus par question à texte libre, du plus récent au plus ancien. */
export const FEEDBACK_RESULTS_MAX_COMMENTS = 100

/**
 * Résultats d'un formulaire pour la page « Voir les résultats ». Des comptes bruts : les
 * pourcentages se calculent à l'affichage. Une entrée par question de la définition, dans l'ordre.
 */
export const ZFeedbackFormResults = z.object({
  // `since` : premier jour (UTC, AAAA-MM-JJ) où le bouton est apparu
  displays: z.object({ total: z.number().int().nonnegative(), since: z.string().nullable() }),
  // `started` : au moins une question répondue
  responses: z.object({ started: z.number().int().nonnegative(), completed: z.number().int().nonnegative() }),
  questions: z.array(
    z.object({
      question_id: z.string(),
      answered: z.number().int().nonnegative(),
      // sélections par valeur (notes et options), vide pour un texte libre
      choices: z.array(z.object({ value: z.string(), count: z.number().int().nonnegative() })),
      // texte libre : nombre total et derniers commentaires, avec la note rapide du même parcours
      comments: z
        .object({
          total: z.number().int().nonnegative(),
          latest: z.array(z.object({ text: z.string(), date: z.coerce.date<Date>(), rating: z.string().nullable() })),
        })
        .nullable(),
    })
  ),
})
export type IFeedbackFormResults = z.output<typeof ZFeedbackFormResults>
export type IFeedbackFormResultsJSON = Jsonify<IFeedbackFormResults>

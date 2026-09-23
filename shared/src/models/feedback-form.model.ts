import type { Jsonify } from "type-fest"

import { z } from "../helpers/zod-with-open-api.js"
import { matchesKnownUiRoute } from "../utils/ui-routes.utils.js"

import type { IModelDescriptor } from "./common.js"
import { zObjectId } from "./common.js"

/**
 * Registre des formulaires de feedback contextuel (widget affiché aux usagers après une
 * interaction). Un formulaire = une définition JSON de questions, un déclencheur (pages +
 * nombre d'interactions) et un statut.
 *
 * Cycle de vie : draft -> active <-> inactive, tout état -> archived (terminal).
 */

export const FEEDBACK_FORM_STATUS = ["draft", "active", "inactive", "archived"] as const
export const ZFeedbackFormStatus = z.enum(FEEDBACK_FORM_STATUS)
export type IFeedbackFormStatus = z.output<typeof ZFeedbackFormStatus>

export const ALLOWED_FEEDBACK_FORM_STATUS_TRANSITIONS: Record<IFeedbackFormStatus, IFeedbackFormStatus[]> = {
  draft: ["active", "archived"],
  active: ["inactive", "archived"],
  inactive: ["active", "archived"],
  archived: [],
}

// --- Questions ---

const zQuestionBase = {
  // slug stable de la question — clé dans `answers` des réponses. Ex : "search_relevance"
  id: z.string().min(1).max(60),
  label: z.string({ error: "Indiquez le libellé de la question" }).min(1, "Indiquez le libellé de la question").max(300, "Le libellé ne peut pas dépasser 300 caractères"),
  required: z.boolean().default(false),
  // affichage conditionnel : n'apparaît que si la question référencée vaut une des valeurs listées
  showIf: z
    .strictObject({
      questionId: z.string(),
      equals: z.union([z.string(), z.array(z.string())]),
    })
    .nullish(),
}

export const FEEDBACK_QUESTION_MIN_OPTIONS = 2
export const FEEDBACK_QUESTION_MAX_OPTIONS = 12

const zSelectOptions = z
  .array(
    z.strictObject({
      // clé stockée dans les réponses, dérivée du libellé côté back-office. Ex : "contact_recruteur"
      value: z.string().max(60),
      label: z.string({ error: "Indiquez le libellé de l'option" }).min(1, "Indiquez le libellé de l'option").max(150, "Le libellé ne peut pas dépasser 150 caractères"),
    })
  )
  .min(FEEDBACK_QUESTION_MIN_OPTIONS, `Proposez au moins ${FEEDBACK_QUESTION_MIN_OPTIONS} options`)
  .max(FEEDBACK_QUESTION_MAX_OPTIONS, `Proposez au plus ${FEEDBACK_QUESTION_MAX_OPTIONS} options`)
  // La valeur est la clé des réponses : vide ou en double, deux choix deviendraient indiscernables
  // dans les résultats. L'erreur est posée sur le libellé, seul champ que l'admin voit.
  .superRefine((options, ctx) => {
    const seen = new Set<string>()
    options.forEach((option, index) => {
      if (!option.label) return
      if (!option.value) {
        ctx.addIssue({ code: "custom", message: "Le libellé doit contenir au moins une lettre ou un chiffre", path: [index, "label"] })
      } else if (seen.has(option.value)) {
        ctx.addIssue({ code: "custom", message: "Cette option est en double", path: [index, "label"] })
      }
      seen.add(option.value)
    })
  })

const ZFeedbackRatingQuestion = z.strictObject({
  ...zQuestionBase,
  type: z.literal("rating"),
  scale: z.enum(["thumbs3", "stars5"]).default("thumbs3"),
})

const ZFeedbackSingleSelectQuestion = z.strictObject({
  ...zQuestionBase,
  type: z.literal("single_select"),
  options: zSelectOptions,
})

const ZFeedbackMultiSelectQuestion = z.strictObject({
  ...zQuestionBase,
  type: z.literal("multi_select"),
  options: zSelectOptions,
  maxSelections: z.number().int().positive().max(12).optional(),
})

const ZFeedbackTextQuestion = z.strictObject({
  ...zQuestionBase,
  type: z.literal("text"),
  maxLength: z
    .number({ error: "Indiquez une longueur maximale" })
    .int("Indiquez un nombre entier")
    .positive("La longueur maximale doit être d'au moins 1 caractère")
    .max(2000, "La longueur maximale ne peut pas dépasser 2000 caractères")
    .default(500),
  placeholder: z.string().max(150).nullish(),
})

export const ZFeedbackQuestion = z.discriminatedUnion("type", [ZFeedbackRatingQuestion, ZFeedbackSingleSelectQuestion, ZFeedbackMultiSelectQuestion, ZFeedbackTextQuestion])
export type IFeedbackQuestion = z.output<typeof ZFeedbackQuestion>

export const FEEDBACK_FORM_MAX_QUESTIONS = 10

const ZFeedbackQuestions = z.array(ZFeedbackQuestion).max(FEEDBACK_FORM_MAX_QUESTIONS, `Un formulaire compte au plus ${FEEDBACK_FORM_MAX_QUESTIONS} questions`).default([])

/** Questions telles qu'elles peuvent être saisies : l'identifiant est la clé des réponses, il doit être unique. */
const ZFeedbackQuestionsInput = ZFeedbackQuestions.superRefine((questions, ctx) => {
  const seen = new Set<string>()
  questions.forEach((question, index) => {
    if (seen.has(question.id)) {
      ctx.addIssue({ code: "custom", message: `L'identifiant de question ${question.id} est utilisé plusieurs fois`, path: [index, "id"] })
    }
    seen.add(question.id)
  })
})

// --- Formulaire ---

const ZFeedbackFormTrigger = z.strictObject({
  minInteractions: z.number({ error: "Indiquez un nombre d'interactions" }).int("Indiquez un nombre entier").positive("Le widget ne peut pas s'afficher au chargement").default(1),
  // chemins où le widget est autorisé à s'afficher, ex : ["/recherche", "/formation/:id/:titre"]
  scope: z.array(z.string().min(1)).default([]),
})

/**
 * Déclencheur tel qu'il peut être *saisi* : un chemin qui ne correspond à aucune page du site est
 * refusé, sinon le widget n'y serait jamais rendu et l'erreur ne se verrait qu'en production.
 *
 * Volontairement absent du schéma de lecture : si une page disparaît de `ui/app`, les formulaires
 * qui la ciblaient doivent rester lisibles et corrigeables dans le back-office, pas faire échouer
 * la sérialisation des réponses de l'API.
 */
const ZFeedbackFormTriggerInput = ZFeedbackFormTrigger.extend({
  scope: z
    .array(z.string().min(1).refine(matchesKnownUiRoute, "Ce chemin ne correspond à aucune page du site"), { error: "Ajoutez au moins une page de déclenchement" })
    .min(1, "Ajoutez au moins une page de déclenchement"),
})

/**
 * Champs éditables depuis le back-office (création / modification).
 *
 * Un formulaire est toujours enregistré en brouillon, construit par blocs successifs
 * (informations générales, puis questions) : exiger au moins une question rendrait impossible
 * l'enregistrement d'un brouillon en cours de rédaction. Cette contrainte est portée par
 * `ZFeedbackFormPublishable`, vérifié au moment de l'activation. La page de déclenchement, elle,
 * est exigée dès la saisie (`ZFeedbackFormTriggerInput`).
 */
export const ZFeedbackFormFields = z.strictObject({
  slug: z
    .string({ error: "Le slug est obligatoire" })
    .min(3, "Le slug doit faire au moins 3 caractères")
    .max(80, "Le slug ne peut pas dépasser 80 caractères")
    .regex(/^[a-z0-9_-]+$/, "Le slug ne peut contenir que des minuscules, chiffres, tirets et tirets bas"),
  title: z.string({ error: "Le titre est obligatoire" }).min(1, "Le titre est obligatoire").max(150, "Le titre ne peut pas dépasser 150 caractères"),
  trigger: ZFeedbackFormTrigger,
  questions: ZFeedbackQuestions,
})

/** Ce que le back-office envoie à la création comme à la modification. */
export const ZFeedbackFormInput = ZFeedbackFormFields.extend({ trigger: ZFeedbackFormTriggerInput, questions: ZFeedbackQuestionsInput })
export type IFeedbackFormInput = z.output<typeof ZFeedbackFormInput>

/** Ce qu'un formulaire doit satisfaire pour pouvoir être activé (et donc affiché aux usagers). */
export const ZFeedbackFormPublishable = ZFeedbackFormInput.superRefine((data, ctx) => {
  if (data.questions.length === 0) {
    ctx.addIssue({ code: "custom", message: "Au moins une question est nécessaire", path: ["questions"] })
  }
})

export const ZFeedbackForm = ZFeedbackFormFields.extend({
  _id: zObjectId,
  status: ZFeedbackFormStatus,
  version: z.number().int().positive(),
  created_at: z.coerce.date<Date>(),
  updated_at: z.coerce.date<Date>(),
  // email de l'admin ayant créé le formulaire (membre de l'équipe, jamais un usager)
  created_by: z.string(),
  status_history: z.array(
    z.strictObject({
      status: ZFeedbackFormStatus,
      date: z.coerce.date<Date>(),
      granted_by: z.string(),
    })
  ),
})
export type IFeedbackForm = z.output<typeof ZFeedbackForm>

/** Vue liste du back-office : le formulaire + son nombre de réponses. */
export const ZFeedbackFormForAdmin = ZFeedbackForm.extend({
  responses_count: z.number().int().nonnegative(),
})
export type IFeedbackFormForAdmin = z.output<typeof ZFeedbackFormForAdmin>
export type IFeedbackFormForAdminJSON = Jsonify<IFeedbackFormForAdmin>

export default {
  zod: ZFeedbackForm,
  indexes: [
    [{ slug: 1 }, { unique: true }],
    [{ status: 1 }, {}],
    // un seul formulaire actif par chemin de déclenchement — contrôlé côté service, l'index sert la lecture publique
    [{ "trigger.scope": 1, status: 1 }, {}],
    [{ updated_at: -1 }, {}],
  ],
  collectionName: "feedback_forms" as const,
} as const satisfies IModelDescriptor

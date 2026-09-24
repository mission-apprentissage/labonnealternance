import { randomUUID } from "node:crypto"

import { badRequest, conflict, notFound } from "@hapi/boom"
import { ObjectId } from "mongodb"
import type { IFeedbackPageContext } from "shared/models/feedback-display.model"
import type { IFeedbackAnswersByQuestion, IFeedbackForm, IFeedbackQuestion } from "shared/models/feedback-form.model"
import { FEEDBACK_RATING_OPTIONS, getFeedbackCurrentQuestion, isFeedbackQuestionVisible } from "shared/models/feedback-form.model"
import type { IFeedbackAnswer, IFeedbackResponse } from "shared/models/feedback-response.model"
import { sanitizeFeedbackUrlParams } from "shared/utils/feedback-url-params"
import { getScopeParamNames } from "shared/utils/ui-routes.utils"

import { getDbCollection } from "@/common/utils/mongodb-utils"

async function getActiveFeedbackForm(slug: string): Promise<IFeedbackForm> {
  const form = await getDbCollection("feedback_forms").findOne({ slug, status: "active" })
  if (!form) {
    throw notFound("Formulaire introuvable")
  }
  return form
}

/**
 * Contexte de page tel qu'il est stocké : la page doit être l'une des pages de déclenchement du
 * formulaire, seules les clés de son motif sont gardées dans `path_params`, et les valeurs
 * identifiantes sont retirées (cf. `sanitizeFeedbackUrlParams`). Rien n'est pris du navigateur sans tri.
 */
function toStoredContext(form: IFeedbackForm, context: IFeedbackPageContext): IFeedbackPageContext {
  if (!form.trigger.scope.includes(context.page)) {
    throw badRequest("Cette page ne déclenche pas ce formulaire")
  }
  const expected = getScopeParamNames(context.page)
  const pathParams = Object.fromEntries(Object.entries(context.path_params).filter(([key]) => expected.includes(key)))
  return {
    page: context.page,
    path_params: sanitizeFeedbackUrlParams(pathParams) as Record<string, string>,
    query: sanitizeFeedbackUrlParams(context.query),
  }
}

/** Enregistre une apparition du bouton, avec son contexte, et incrémente le compteur du jour (UTC). */
export async function recordFeedbackDisplay(slug: string, context: IFeedbackPageContext): Promise<string> {
  const form = await getActiveFeedbackForm(slug)
  const now = new Date()
  const _id = new ObjectId()
  await getDbCollection("feedback_displays").insertOne({ _id, form_slug: slug, ...toStoredContext(form, context), created_at: now })
  await getDbCollection("feedback_display_counts").updateOne(
    { form_slug: slug, day: now.toISOString().slice(0, 10) },
    { $inc: { displays: 1 }, $setOnInsert: { _id: new ObjectId() } },
    { upsert: true }
  )
  return _id.toString()
}

/** Ouvre un parcours à partir de l'affichage qui l'a déclenché, dont il reprend le contexte de page. */
export async function startFeedbackResponse(slug: string, displayId: string): Promise<{ response_id: string; token: string }> {
  await getActiveFeedbackForm(slug)
  const display = ObjectId.isValid(displayId) ? await getDbCollection("feedback_displays").findOne({ _id: new ObjectId(displayId), form_slug: slug }) : null
  if (!display) {
    throw notFound("Affichage introuvable")
  }

  const now = new Date()
  const response: IFeedbackResponse = {
    _id: new ObjectId(),
    form_slug: slug,
    display_id: display._id,
    page: display.page,
    path_params: display.path_params,
    query: display.query,
    status: "in_progress",
    answers: [],
    skipped: [],
    token: randomUUID(),
    created_at: now,
    updated_at: now,
    completed_at: null,
  }
  await getDbCollection("feedback_responses").insertOne(response)
  return { response_id: response._id.toString(), token: response.token }
}

function assertAnswerFits(question: IFeedbackQuestion, answer: IFeedbackAnswer): void {
  if (question.type === "text") {
    if (!("text" in answer) || answer.text.length > question.maxLength) {
      throw badRequest(`Réponse invalide à la question « ${question.label} »`)
    }
    return
  }
  const allowed: string[] = question.type === "rating" ? FEEDBACK_RATING_OPTIONS.map(({ value }) => value) : question.options.map(({ value }) => value)
  const valid =
    "choices" in answer &&
    new Set(answer.choices).size === answer.choices.length &&
    answer.choices.every((choice) => allowed.includes(choice)) &&
    (question.type === "multi_select" ? question.maxSelections === undefined || answer.choices.length <= question.maxSelections : answer.choices.length === 1)
  if (!valid) {
    throw badRequest(`Réponse invalide à la question « ${question.label} »`)
  }
}

const toAnswersByQuestion = (answers: IFeedbackAnswer[]): IFeedbackAnswersByQuestion =>
  Object.fromEntries(answers.map((answer) => [answer.question_id, "text" in answer ? answer.text : answer.choices.length === 1 ? answer.choices[0] : answer.choices]))

/**
 * Vérifie un état de parcours contre la définition : questions connues, chacune une seule fois,
 * valeurs permises, conditions d'affichage remplies, questions obligatoires jamais passées.
 */
function assertValidProgress(questions: IFeedbackQuestion[], answers: IFeedbackAnswer[], skipped: string[]): IFeedbackAnswersByQuestion {
  const ids = [...answers.map(({ question_id }) => question_id), ...skipped]
  if (new Set(ids).size !== ids.length) {
    throw badRequest("Une question ne peut être répondue ou passée qu'une fois")
  }
  const byQuestion = toAnswersByQuestion(answers)
  for (const id of ids) {
    const question = questions.find((candidate) => candidate.id === id)
    if (!question) {
      throw badRequest("Question inconnue")
    }
    if (!isFeedbackQuestionVisible(question, byQuestion)) {
      throw badRequest(`La question « ${question.label} » ne devait pas être posée`)
    }
  }
  for (const answer of answers) {
    assertAnswerFits(questions.find(({ id }) => id === answer.question_id)!, answer)
  }
  for (const id of skipped) {
    if (questions.find((question) => question.id === id)?.required) {
      throw badRequest("Une question obligatoire ne peut pas être passée")
    }
  }
  return byQuestion
}

/** Remplace l'état du parcours ; il est terminé quand plus aucune question ne reste à poser. */
export async function updateFeedbackResponse(id: string, { token, answers, skipped }: { token: string; answers: IFeedbackAnswer[]; skipped: string[] }) {
  const response = ObjectId.isValid(id) ? await getDbCollection("feedback_responses").findOne({ _id: new ObjectId(id) }) : null
  // même réponse pour un id inconnu ou un mauvais jeton : rien ne permet de deviner les parcours existants
  if (!response || response.token !== token) {
    throw notFound("Réponse introuvable")
  }
  const form = await getDbCollection("feedback_forms").findOne({ slug: response.form_slug })
  if (!form || form.status === "archived") {
    throw conflict("Ce formulaire n'accepte plus de réponses")
  }

  const byQuestion = assertValidProgress(form.questions, answers, skipped)
  const completed = getFeedbackCurrentQuestion(form.questions, byQuestion, skipped) === undefined
  const now = new Date()
  await getDbCollection("feedback_responses").updateOne(
    { _id: response._id },
    { $set: { answers, skipped, status: completed ? "completed" : "in_progress", updated_at: now, completed_at: completed ? (response.completed_at ?? now) : null } }
  )
  return { status: completed ? ("completed" as const) : ("in_progress" as const) }
}

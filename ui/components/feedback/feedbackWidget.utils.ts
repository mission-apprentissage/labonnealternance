import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { FEEDBACK_RATING_OPTIONS, getFeedbackQuestionChoices, isFeedbackQuestionVisible } from "shared/models/feedback-form.model"
import type { IFeedbackAnswer } from "shared/models/feedback-response.model"

/** Valeur d'une réponse : une option (ou note) pour un choix unique, plusieurs pour un choix multiple, du texte libre. */
export type IFeedbackAnswerValue = string | string[]

export type IFeedbackAnswers = Record<string, IFeedbackAnswerValue>

const RATING_ICONS = {
  positive: "ri-thumb-up-line",
  neutral: "ri-emotion-normal-line",
  negative: "ri-thumb-down-line",
} as const

/** Les trois notes rapides, dans l'ordre d'affichage, avec leur icône. */
export const RATING_OPTIONS = FEEDBACK_RATING_OPTIONS.map((option) => ({ ...option, iconId: RATING_ICONS[option.value] }))

// règles partagées avec le serveur, qui valide les réponses reçues
export { getFeedbackCurrentQuestion as getCurrentQuestion, isFeedbackQuestionVisible as isQuestionVisible } from "shared/models/feedback-form.model"

/**
 * Question sur laquelle « Retour » ramène : la dernière, avant la question courante, qui a été
 * répondue ou passée. Les réponses forment toujours un préfixe du parcours (revenir en arrière
 * retire la réponse de la question rouverte), donc c'est bien l'étape précédente.
 */
export function getPreviousQuestion(questions: IFeedbackQuestion[], answers: IFeedbackAnswers, skipped: string[]): IFeedbackQuestion | undefined {
  return [...questions].reverse().find((question) => question.id in answers || skipped.includes(question.id))
}

/**
 * « Étape N sur M » : rang de la question courante parmi celles qui seront posées. Une question
 * conditionnelle ne compte qu'une fois sa condition remplie, le total peut donc augmenter en route.
 */
export function getStepProgress(questions: IFeedbackQuestion[], answers: IFeedbackAnswers, current: IFeedbackQuestion): { step: number; total: number } {
  const asked = questions.filter((question) => isFeedbackQuestionVisible(question, answers))
  return { step: asked.findIndex((question) => question.id === current.id) + 1, total: asked.length }
}

/** Réponses du widget au format enregistré : un texte, ou des choix toujours en tableau. */
export function toFeedbackAnswerList(questions: IFeedbackQuestion[], answers: IFeedbackAnswers): IFeedbackAnswer[] {
  return questions.flatMap((question): IFeedbackAnswer[] => {
    const value = answers[question.id]
    if (value === undefined) return []
    return question.type === "text" ? [{ question_id: question.id, text: String(value) }] : [{ question_id: question.id, choices: [value].flat() }]
  })
}

/** Réponse telle qu'un humain la lit : libellés plutôt que valeurs techniques. */
export function formatAnswer(question: IFeedbackQuestion, value: IFeedbackAnswerValue): string {
  if (question.type === "text") {
    return typeof value === "string" && value ? `« ${value} »` : "(vide)"
  }
  const values = [value].flat()
  if (values.length === 0) return "aucune option"
  const choices = getFeedbackQuestionChoices(question)
  return values.map((item) => choices.find((choice) => choice.value === item)?.label ?? item).join(", ")
}

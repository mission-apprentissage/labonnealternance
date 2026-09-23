import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { FEEDBACK_RATING_OPTIONS, getFeedbackQuestionChoices } from "shared/models/feedback-form.model"

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

/**
 * Affichage conditionnel : une question dont la condition n'est pas remplie est retirée de
 * l'enchaînement. Le back-office ne permet pas encore d'en créer, mais le widget respecte déjà
 * celles qui existeraient dans une définition.
 */
export function isQuestionVisible(question: IFeedbackQuestion, answers: IFeedbackAnswers): boolean {
  if (!question.showIf) return true
  const answer = answers[question.showIf.questionId]
  if (answer === undefined) return false
  const expected = [question.showIf.equals].flat()
  return [answer].flat().some((value) => expected.includes(value))
}

/**
 * Question à poser maintenant : la première, dans l'ordre, qui est visible et n'a été ni répondue
 * ni passée. `undefined` quand le parcours est terminé.
 */
export function getCurrentQuestion(questions: IFeedbackQuestion[], answers: IFeedbackAnswers, skipped: string[]): IFeedbackQuestion | undefined {
  return questions.find((question) => isQuestionVisible(question, answers) && !(question.id in answers) && !skipped.includes(question.id))
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

import type { IFeedbackQuestion } from "shared/models/feedback-form.model"

import type { IFeedbackWidgetProgress } from "@/components/feedback/FeedbackWidget"
import { formatAnswer, getCurrentQuestion, isQuestionVisible } from "@/components/feedback/feedbackWidget.utils"

/** Un essai = un parcours du widget, du premier affichage à la fin, la fermeture ou « Recommencer ». */
export type IPreviewTrial = IFeedbackWidgetProgress & { id: number }

export const createTrial = (id: number): IPreviewTrial => ({ id, answers: {}, skipped: [], status: "in_progress" })

export type IQuestionTrialStatus =
  | { kind: "answered"; answer: string }
  | { kind: "skipped" }
  | { kind: "current" }
  | { kind: "closed_here" }
  | { kind: "upcoming" }
  | { kind: "not_asked" }
  | { kind: "hidden" }

/** Où en est chaque question dans un essai, dans l'ordre de la définition. */
export function getQuestionStatuses(questions: IFeedbackQuestion[], trial: IPreviewTrial): IQuestionTrialStatus[] {
  const current = getCurrentQuestion(questions, trial.answers, trial.skipped)
  return questions.map((question) => {
    if (question.id in trial.answers) return { kind: "answered", answer: formatAnswer(question, trial.answers[question.id]) }
    if (trial.skipped.includes(question.id)) return { kind: "skipped" }
    if (question.id === current?.id) return { kind: trial.status === "closed" ? "closed_here" : "current" }
    if (!isQuestionVisible(question, trial.answers)) return { kind: "hidden" }
    return { kind: trial.status === "closed" ? "not_asked" : "upcoming" }
  })
}

const plural = (count: number, singular: string, pluralForm: string) => `${count} ${count > 1 ? pluralForm : singular}`

/** Ex : « 2 répondues · 1 passée · 1 en cours · 1 à venir ». Les catégories vides sont omises. */
export function summarizeStatuses(statuses: IQuestionTrialStatus[]): string {
  const count = (kinds: IQuestionTrialStatus["kind"][]) => statuses.filter((status) => kinds.includes(status.kind)).length
  return [
    [count(["answered"]), plural(count(["answered"]), "répondue", "répondues")],
    [count(["skipped"]), plural(count(["skipped"]), "passée", "passées")],
    [count(["current"]), `${count(["current"])} en cours`],
    [count(["upcoming"]), `${count(["upcoming"])} à venir`],
    [count(["closed_here", "not_asked"]), plural(count(["closed_here", "not_asked"]), "non posée", "non posées")],
    [count(["hidden"]), plural(count(["hidden"]), "masquée", "masquées")],
  ]
    .filter(([n]) => n)
    .map(([, label]) => label)
    .join(" · ")
}

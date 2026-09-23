import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { FEEDBACK_RATING_OPTIONS } from "shared/models/feedback-form.model"
import { hashcode } from "shared/utils/string-utils"

// TODO valeurs factices, à remplacer par l'agrégat de feedback_responses quand la collection existera
export const FAKE_RESULTS = { displays: 4786, responses: 623, completed: 354, comments: 39, whyAnswers: 12 }

export type IFeedbackChoiceStat = { value: string; label: string; share: number }
export type IFeedbackComment = { id: string; text: string; date: string; rating: string | null }

export type IFeedbackQuestionStats =
  | { kind: "choices"; responses: number; choices: IFeedbackChoiceStat[] }
  | { kind: "selections"; responses: number; selections: number; choices: IFeedbackChoiceStat[] }
  | { kind: "comments"; responses: number; comments: IFeedbackComment[] }

const RATING_WEIGHTS = [71, 21, 8]

const LOREM = [
  "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed non risus, suspendisse lectus tortor, dignissim sit amet, adipiscing nec, ultricies sed, dolor.",
  "Cras elementum ultrices diam. Maecenas ligula massa, varius a, semper congue, euismod non, mi.",
  "Proin porttitor, orci nec nonummy molestie, enim est eleifend mi, non fermentum diam nisl sit amet erat.",
  "Duis semper. Duis arcu massa, scelerisque vitae, consequat in, pretium a, enim. Pellentesque congue.",
  "Ut in risus volutpat libero pharetra tempor. Cras vestibulum bibendum augue.",
]

/** Arrondit des poids en pourcentages entiers dont la somme fait exactement 100. */
export function toShares(weights: number[]): number[] {
  const total = weights.reduce((sum, weight) => sum + weight, 0)
  if (!total) return weights.map(() => 0)
  const raw = weights.map((weight) => (weight / total) * 100)
  const shares = raw.map(Math.floor)
  const byRemainder = raw.map((value, index) => ({ index, remainder: value - Math.floor(value) })).sort((a, b) => b.remainder - a.remainder)
  const missing = 100 - shares.reduce((sum, share) => sum + share, 0)
  for (let i = 0; i < missing; i++) shares[byRemainder[i].index] += 1
  return shares
}

/** Poids pseudo-aléatoires mais stables : la page affiche les mêmes chiffres à chaque visite. */
const stableWeights = (seed: string, count: number) => Array.from({ length: count }, (_, index) => (Math.abs(hashcode(`${seed}-${index}`)) % 90) + 10)

export function getFakeQuestionStats(question: IFeedbackQuestion, index: number, questions: IFeedbackQuestion[]): IFeedbackQuestionStats {
  const responses = Math.round(FAKE_RESULTS.responses * Math.max(0.1, 1 - 0.2 * index))

  switch (question.type) {
    case "rating": {
      const shares = toShares(RATING_WEIGHTS)
      return { kind: "choices", responses, choices: FEEDBACK_RATING_OPTIONS.map((option, position) => ({ ...option, share: shares[position] })) }
    }
    case "single_select": {
      const shares = toShares(stableWeights(question.id, question.options.length))
      return { kind: "choices", responses, choices: question.options.map((option, position) => ({ ...option, share: shares[position] })) }
    }
    case "multi_select": {
      const shares = toShares(stableWeights(question.id, question.options.length))
      const choices = question.options.map((option, position) => ({ ...option, share: shares[position] })).sort((a, b) => b.share - a.share)
      return { kind: "selections", responses, selections: Math.round(responses * 2.2), choices }
    }
    case "text": {
      const count = Math.max(3, Math.round(responses / 16))
      const rating = questions.find((candidate) => candidate.type === "rating")
      const comments = Array.from({ length: count }, (_, position) => ({
        id: `${question.id}-${position}`,
        text: LOREM[position % LOREM.length],
        date: new Date(Date.UTC(2026, 7, 10 - (position % 10))).toISOString(),
        rating: rating ? FEEDBACK_RATING_OPTIONS[position % FEEDBACK_RATING_OPTIONS.length].label : null,
      }))
      return { kind: "comments", responses: count, comments }
    }
  }
}

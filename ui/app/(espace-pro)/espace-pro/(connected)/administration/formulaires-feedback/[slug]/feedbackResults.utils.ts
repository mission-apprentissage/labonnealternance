import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { getFeedbackQuestionChoices } from "shared/models/feedback-form.model"
import type { IFeedbackFormResultsJSON } from "shared/models/feedback-response.model"

export type IFeedbackQuestionResults = IFeedbackFormResultsJSON["questions"][number]
export type IFeedbackChoiceStat = { value: string; label: string; count: number; share: number }

/** Arrondit des comptes en pourcentages entiers dont la somme fait exactement 100 (plus forts restes). */
export function toShares(counts: number[]): number[] {
  const total = counts.reduce((sum, count) => sum + count, 0)
  if (!total) return counts.map(() => 0)
  const raw = counts.map((count) => (count / total) * 100)
  const shares = raw.map(Math.floor)
  const byRemainder = raw.map((value, index) => ({ index, remainder: value - Math.floor(value) })).sort((a, b) => b.remainder - a.remainder)
  const missing = 100 - shares.reduce((sum, share) => sum + share, 0)
  for (let i = 0; i < missing; i++) shares[byRemainder[i].index] += 1
  return shares
}

/**
 * Une barre par réponse possible de la définition, y compris celles que personne n'a choisies.
 * Pour une note ou un choix unique, les pourcentages portent sur les réponses à la question ; pour
 * un choix multiple, sur le total des sélections, et les options sont triées de la plus choisie à
 * la moins choisie.
 */
export function getChoiceStats(question: IFeedbackQuestion, results: IFeedbackQuestionResults): IFeedbackChoiceStat[] {
  const counts = getFeedbackQuestionChoices(question).map(({ value, label }) => ({ value, label, count: results.choices.find((choice) => choice.value === value)?.count ?? 0 }))
  const shares = toShares(counts.map(({ count }) => count))
  const stats = counts.map((choice, index) => ({ ...choice, share: shares[index] }))
  return question.type === "multi_select" ? stats.sort((a, b) => b.count - a.count) : stats
}

/** « 13 % » : part arrondie, ou `null` quand le total est nul (pas de pourcentage sur rien). */
export const formatShare = (part: number, total: number): string | null => (total ? `${Math.round((part / total) * 100)} %` : null)

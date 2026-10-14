import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import { formatShare, getChoiceStats, toShares } from "./feedbackResults.utils"

describe("toShares", () => {
  it("arrondit en pourcentages entiers dont la somme fait 100", () => {
    expect(toShares([1, 1, 1])).toEqual([34, 33, 33])
    expect(toShares([71, 21, 8])).toEqual([71, 21, 8])
    expect(toShares([3, 7, 11, 2]).reduce((sum, share) => sum + share, 0)).toBe(100)
  })

  it("renvoie des zéros sans compte", () => {
    expect(toShares([0, 0])).toEqual([0, 0])
  })
})

describe("getChoiceStats", () => {
  const rating: IFeedbackQuestion = { id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3", showIf: null }
  const multi: IFeedbackQuestion = {
    id: "q2",
    type: "multi_select",
    label: "Filtres ?",
    required: false,
    showIf: null,
    options: [
      { value: "contrat", label: "Contrat" },
      { value: "niveau", label: "Niveau" },
      { value: "date", label: "Date" },
    ],
  }

  it("liste toutes les réponses possibles dans l'ordre de la définition, même non choisies", () => {
    expect(
      getChoiceStats(rating, {
        question_id: "q1",
        answered: 3,
        choices: [
          { value: "negative", count: 2 },
          { value: "positive", count: 1 },
        ],
        comments: null,
      })
    ).toEqual([
      { value: "positive", label: "Très bien", count: 1, share: 33 },
      { value: "neutral", label: "Moyen", count: 0, share: 0 },
      { value: "negative", label: "Pas convaincu", count: 2, share: 67 },
    ])
  })

  it("trie un choix multiple du plus choisi au moins choisi", () => {
    const stats = getChoiceStats(multi, {
      question_id: "q2",
      answered: 2,
      choices: [
        { value: "niveau", count: 1 },
        { value: "date", count: 3 },
      ],
      comments: null,
    })
    expect(stats.map(({ value, share }) => [value, share])).toEqual([
      ["date", 75],
      ["niveau", 25],
      ["contrat", 0],
    ])
  })
})

describe("formatShare", () => {
  it("donne un pourcentage arrondi, ou null sur un total nul", () => {
    expect(formatShare(623, 4786)).toBe("13 %")
    expect(formatShare(0, 0)).toBeNull()
  })
})

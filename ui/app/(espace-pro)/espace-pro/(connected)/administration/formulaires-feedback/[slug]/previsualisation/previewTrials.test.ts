import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import { createTrial, getQuestionStatuses, summarizeStatuses } from "./previewTrials"

const questions: IFeedbackQuestion[] = [
  { id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3", showIf: null },
  {
    id: "q2",
    type: "single_select",
    label: "Version ?",
    required: false,
    showIf: null,
    options: [
      { value: "nouvelle", label: "Nouvelle" },
      { value: "ancienne", label: "Ancienne" },
    ],
  },
  { id: "q3", type: "text", label: "Un commentaire ?", required: false, maxLength: 500, showIf: null },
]

describe("essais de prévisualisation", () => {
  it("situe chaque question d'un essai en cours", () => {
    const statuses = getQuestionStatuses(questions, { ...createTrial(1), answers: { q1: "positive" } })

    expect(statuses).toEqual([{ kind: "answered", answer: "Très bien" }, { kind: "current" }, { kind: "upcoming" }])
    expect(summarizeStatuses(statuses)).toEqual("1 répondue · 1 en cours · 1 à venir")
  })

  it("distingue les questions passées et celles jamais posées après une fermeture", () => {
    const statuses = getQuestionStatuses(questions, { ...createTrial(1), answers: { q1: "negative" }, skipped: ["q2"], status: "closed" })

    expect(statuses).toEqual([{ kind: "answered", answer: "Pas convaincu" }, { kind: "skipped" }, { kind: "closed_here" }])
    expect(summarizeStatuses(statuses)).toEqual("1 répondue · 1 passée · 1 non posée")
  })

  it("résume un essai terminé", () => {
    const statuses = getQuestionStatuses(questions, { ...createTrial(1), answers: { q1: "positive", q2: "nouvelle", q3: "Parfait" }, status: "completed" })

    expect(summarizeStatuses(statuses)).toEqual("3 répondues")
  })

  it("ne dit une question conditionnelle masquée qu'une fois sa condition tranchée", () => {
    const conditional: IFeedbackQuestion = { id: "q2", type: "text", label: "Pourquoi ?", required: false, maxLength: 500, showIf: { questionId: "q1", equals: "negative" } }
    const withCondition = [questions[0], conditional]

    expect(getQuestionStatuses(withCondition, createTrial(1))[1]).toEqual({ kind: "upcoming" })
    expect(getQuestionStatuses(withCondition, { ...createTrial(1), answers: { q1: "positive" }, status: "completed" })[1]).toEqual({ kind: "hidden" })
    expect(getQuestionStatuses(withCondition, { ...createTrial(1), answers: { q1: "negative" } })[1]).toEqual({ kind: "current" })
  })
})

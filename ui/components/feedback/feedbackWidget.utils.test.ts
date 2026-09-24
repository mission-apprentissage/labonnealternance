import type { IFeedbackQuestion } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import { formatAnswer, getCurrentQuestion, getPreviousQuestion, getStepProgress, isQuestionVisible } from "./feedbackWidget.utils"

const rating: IFeedbackQuestion = { id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3", showIf: null }
const multi: IFeedbackQuestion = {
  id: "q2",
  type: "multi_select",
  label: "Qu'est-ce qui a manqué ?",
  required: false,
  showIf: null,
  options: [
    { value: "contact", label: "Contact" },
    { value: "adresse", label: "Adresse" },
  ],
}
const text: IFeedbackQuestion = { id: "q3", type: "text", label: "Pourquoi ?", required: false, maxLength: 500, showIf: { questionId: "q1", equals: "negative" } }

describe("widget de feedback", () => {
  it("pose les questions dans l'ordre, en sautant les répondues et les passées", () => {
    expect(getCurrentQuestion([rating, multi], {}, [])?.id).toEqual("q1")
    expect(getCurrentQuestion([rating, multi], { q1: "positive" }, [])?.id).toEqual("q2")
    expect(getCurrentQuestion([rating, multi], { q1: "positive" }, ["q2"])).toBeUndefined()
  })

  it("retire de l'enchaînement une question dont la condition n'est pas remplie", () => {
    expect(isQuestionVisible(text, { q1: "positive" })).toBe(false)
    expect(isQuestionVisible(text, { q1: "negative" })).toBe(true)
    expect(getCurrentQuestion([rating, text], { q1: "positive" }, [])).toBeUndefined()
  })

  it("ramène à la dernière question répondue ou passée", () => {
    expect(getPreviousQuestion([rating, multi, text], {}, [])).toBeUndefined()
    expect(getPreviousQuestion([rating, multi, text], { q1: "negative" }, [])?.id).toEqual("q1")
    expect(getPreviousQuestion([rating, multi, text], { q1: "negative" }, ["q2"])?.id).toEqual("q2")
  })

  it("numérote les étapes parmi les questions qui seront posées", () => {
    expect(getStepProgress([rating, multi, text], {}, rating)).toEqual({ step: 1, total: 2 })
    expect(getStepProgress([rating, multi, text], { q1: "negative" }, multi)).toEqual({ step: 2, total: 3 })
    expect(getStepProgress([rating, multi, text], { q1: "positive" }, multi)).toEqual({ step: 2, total: 2 })
  })

  it("affiche les libellés plutôt que les valeurs stockées", () => {
    expect(formatAnswer(rating, "negative")).toEqual("Pas convaincu")
    expect(formatAnswer(multi, ["contact", "adresse"])).toEqual("Contact, Adresse")
    expect(formatAnswer(multi, [])).toEqual("aucune option")
    expect(formatAnswer(text, "Trop lent")).toEqual("« Trop lent »")
  })
})

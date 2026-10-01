import { describe, expect, it } from "vitest"

import type { IFeedbackFormDraft } from "./questionDrafts"
import { createQuestionDraft, nextQuestionId, toFeedbackFormDraft, toFeedbackFormInput, toFeedbackQuestion, toQuestionDraft } from "./questionDrafts"

const form = (questions: IFeedbackFormDraft["questions"]): IFeedbackFormDraft => ({
  slug: "fiche_entreprise",
  title: "Fiche entreprise",
  trigger: { type: "interactions", minInteractions: 1, scope: [] },
  questions,
})

describe("brouillons de questions", () => {
  it("démarre un formulaire avec une question « Note rapide » vide", () => {
    const draft = toFeedbackFormDraft({ slug: "", title: "", trigger: { type: "interactions", minInteractions: 1, scope: [] }, questions: [] })

    expect(draft.questions).toEqual([expect.objectContaining({ id: "q1", type: "rating", label: "" })])
  })

  it("conserve la saisie de chaque type quand on change de type puis revient en arrière", () => {
    const draft = { ...createQuestionDraft("q1"), type: "multi_select" as const, label: "Qu'est-ce qui vous a manqué ?", options: [{ label: "Contact" }, { label: "Adresse" }] }

    const backAndForth = { ...draft, type: "text" as const, maxLength: 300 }
    const restored = { ...backAndForth, type: "multi_select" as const }

    expect(toFeedbackQuestion(restored)).toMatchObject({ type: "multi_select", options: [{ label: "Contact" }, { label: "Adresse" }] })
    expect(toFeedbackQuestion({ ...restored, type: "text" })).toMatchObject({ type: "text", maxLength: 300 })
  })

  it("n'enregistre que les paramètres du type retenu", () => {
    const draft = { ...createQuestionDraft("q1"), type: "text" as const, label: "Un commentaire ?", options: [{ label: "Oubliée" }, { label: "Aussi" }] }

    const question = toFeedbackQuestion(draft)

    expect(question).toEqual({ id: "q1", type: "text", label: "Un commentaire ?", required: false, showIf: null, maxLength: 500, placeholder: null })
  })

  it("n'enregistre la condition d'affichage que si la case est cochée, sans la perdre quand elle est décochée", () => {
    const draft = { ...createQuestionDraft("q2"), label: "Pourquoi ?", conditional: true, showIf: { questionId: "q1", equals: "negative" } }

    expect(toFeedbackQuestion(draft).showIf).toEqual({ questionId: "q1", equals: "negative" })
    expect(toFeedbackQuestion({ ...draft, conditional: false }).showIf).toBeNull()
    expect(toFeedbackQuestion({ ...draft, conditional: false, type: "rating" })).toMatchObject({ showIf: null })
  })

  it("garde une question conditionnelle sans libellé pour la signaler plutôt que l'écarter", () => {
    const { draftIndexes } = toFeedbackFormInput(form([{ ...createQuestionDraft("q1"), conditional: true }]))

    expect(draftIndexes).toEqual([0])
  })

  it("dérive la valeur de chaque option de son libellé", () => {
    const draft = { ...createQuestionDraft("q1"), type: "single_select" as const, label: "Pourquoi ?", options: [{ label: "Contact recruteur" }, { label: "Adresse et accès" }] }

    expect(toFeedbackQuestion(draft)).toMatchObject({
      options: [
        { value: "contact_recruteur", label: "Contact recruteur" },
        { value: "adresse_et_acces", label: "Adresse et accès" },
      ],
    })
  })

  it("écarte les questions laissées vides et garde l'index de brouillon des autres", () => {
    const filled = { ...createQuestionDraft("q2"), label: "Utile ?" }

    const { input, draftIndexes } = toFeedbackFormInput(form([createQuestionDraft("q1"), filled]))

    expect(input.questions.map(({ id }) => id)).toEqual(["q2"])
    expect(draftIndexes).toEqual([1])
  })

  it("ne réattribue jamais l'identifiant d'une question encore présente", () => {
    expect(nextQuestionId([createQuestionDraft("q1"), createQuestionDraft("q3")])).toEqual("q4")
    expect(nextQuestionId([createQuestionDraft("search_relevance")])).toEqual("q1")
  })

  it("recharge une question enregistrée sans perdre ses champs non éditables", () => {
    const draft = toQuestionDraft({
      id: "q1",
      type: "text",
      label: "Un mot ?",
      required: true,
      maxLength: 200,
      placeholder: "Votre avis",
      showIf: { questionId: "q0", equals: "negative" },
    })

    expect(toFeedbackQuestion(draft)).toEqual({
      id: "q1",
      type: "text",
      label: "Un mot ?",
      required: true,
      maxLength: 200,
      placeholder: "Votre avis",
      showIf: { questionId: "q0", equals: "negative" },
    })
  })
})

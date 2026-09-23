import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import { toDuplicateFormInput } from "./duplicateFeedbackForm"

const source: IFeedbackFormInput = {
  slug: "fiche_entreprise",
  title: "Fiche entreprise",
  trigger: { minInteractions: 3, scope: ["/recherche"] },
  questions: [{ id: "q1", type: "rating", label: "Utile ?", required: true, scale: "thumbs3", showIf: null }],
}

describe("toDuplicateFormInput", () => {
  it("reprend déclencheur et questions sous un nouveau titre et un nouveau slug", () => {
    expect(toDuplicateFormInput(source)).toEqual({
      slug: "fiche_entreprise_copie",
      title: "Fiche entreprise (copie)",
      trigger: source.trigger,
      questions: source.questions,
    })
  })

  it("garde le suffixe visible quand le titre d'origine est déjà à la longueur maximale", () => {
    const { title } = toDuplicateFormInput({ ...source, title: "a".repeat(150) })

    expect(title).toHaveLength(150)
    expect(title.endsWith(" (copie)")).toBe(true)
  })

  it("conserve un chemin devenu invalide pour qu'il soit signalé plutôt que perdu", () => {
    const { trigger } = toDuplicateFormInput({ ...source, trigger: { minInteractions: 1, scope: ["/page-supprimee"] } })

    expect(trigger.scope).toEqual(["/page-supprimee"])
  })
})

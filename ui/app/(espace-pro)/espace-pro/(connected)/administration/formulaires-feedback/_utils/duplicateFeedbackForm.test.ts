import type { IFeedbackFormInput } from "shared/models/feedback-form.model"
import { describe, expect, it } from "vitest"

import { nextFeedbackFormSlug, toDuplicateFormInput, toNewFormFromAnswered } from "./duplicateFeedbackForm"

const source: IFeedbackFormInput = {
  slug: "fiche_entreprise",
  title: "Fiche entreprise",
  trigger: { type: "interactions", minInteractions: 3, scope: ["/recherche"] },
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
    const { trigger } = toDuplicateFormInput({ ...source, trigger: { type: "interactions", minInteractions: 1, scope: ["/page-supprimee"] } })

    expect(trigger.scope).toEqual(["/page-supprimee"])
  })
})

describe("nextFeedbackFormSlug", () => {
  it("ajoute ou incrémente un suffixe numérique", () => {
    expect(nextFeedbackFormSlug("recherche")).toBe("recherche_2")
    expect(nextFeedbackFormSlug("recherche_2")).toBe("recherche_3")
    expect(nextFeedbackFormSlug("recherche_v1")).toBe("recherche_v1_2")
  })

  it("reste dans la limite de 80 caractères", () => {
    expect(nextFeedbackFormSlug("a".repeat(80))).toBe(`${"a".repeat(78)}_2`)
  })
})

describe("toNewFormFromAnswered", () => {
  it("reprend tout sauf le slug", () => {
    const source = { slug: "recherche", title: "Recherche", trigger: { type: "interactions", minInteractions: 2, scope: ["/recherche"] }, questions: [] }
    expect(toNewFormFromAnswered(source)).toEqual({ ...source, slug: "recherche_2" })
  })
})

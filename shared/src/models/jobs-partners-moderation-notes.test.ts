import { describe, expect, it } from "vitest"

import { MODERATION_CATEGORIES } from "./jobs-partners-moderation.model.js"
import { buildAgentNoteParagraphs, MODERATION_CATEGORY_LABELS, MODERATION_CATEGORY_NOTES } from "./jobs-partners-moderation-notes.js"

describe("textes de la note de l'agent", () => {
  it("couvrent chaque catégorie du classifieur", () => {
    for (const category of MODERATION_CATEGORIES) {
      expect(MODERATION_CATEGORY_LABELS[category], category).toBeTruthy()
      expect(MODERATION_CATEGORY_NOTES[category], category).toBeTruthy()
    }
    expect(Object.keys(MODERATION_CATEGORY_NOTES).sort()).toEqual([...MODERATION_CATEGORIES].sort())
  })
})

describe("buildAgentNoteParagraphs", () => {
  it("regroupe les extraits d'une catégorie par champ et n'écrit son texte qu'une fois", () => {
    const paragraphs = buildAgentNoteParagraphs([
      { champ: "job_description", category: "mineurs", verbatim: "majeurs uniquement" },
      { champ: "job_employer_description", category: "mineurs", verbatim: "équipe de nuit" },
      { champ: "job_description", category: "mineurs", verbatim: "service en salle jusqu'à 2 h" },
    ])

    expect(paragraphs).toEqual([
      `Dans la description de l’offre, vous avez écrit “majeurs uniquement” et “service en salle jusqu'à 2 h”. Dans la description de l’entreprise, vous avez écrit “équipe de nuit”. ${MODERATION_CATEGORY_NOTES.mineurs}`,
    ])
  })

  it("garde l'ordre des constats, ignore un extrait en double et laisse le texte seul quand l'extrait est purgé", () => {
    const paragraphs = buildAgentNoteParagraphs([
      { champ: "job_description", category: "experience_exigee", verbatim: "3 ans d'expérience" },
      { champ: "job_description", category: "discrimination", verbatim: null },
      { champ: "job_description", category: "experience_exigee", verbatim: " 3 ans d'expérience " },
    ])

    expect(paragraphs).toEqual([
      `Dans la description de l’offre, vous avez écrit “3 ans d'expérience”. ${MODERATION_CATEGORY_NOTES.experience_exigee}`,
      MODERATION_CATEGORY_NOTES.discrimination,
    ])
  })

  it("ne produit rien sans constat", () => {
    expect(buildAgentNoteParagraphs([])).toEqual([])
  })
})

import assert from "assert"

import { describe, it } from "vitest"

import { deduplicateFormations } from "../../src/services/formation.service"

describe("formation", () => {
  const sampleFormation1 = [
    { nom: "a1", intitule: "b1", etablissement_formateur_siret: "c1", diplome: "d1", code_postal: "e1" },
    { nom: "a1", intitule: "b1", etablissement_formateur_siret: "c1", diplome: "d1", code_postal: "e1" },
    { nom: "a2", intitule: "b2", etablissement_formateur_siret: "c2", diplome: "d2", code_postal: "e2" },
    { nom: "a1", intitule: "b1", etablissement_formateur_siret: "c1", diplome: "d1", code_postal: "e1" },
  ]

  const sampleFormation2 = [
    { nom: "a1", intitule: "b1", etablissement_formateur_siret: "c1", diplome: "d1", code_postal: "e1" },
    { nom: "a2", intitule: "b2", etablissement_formateur_siret: "c2", diplome: "d2", code_postal: "e2" },
    { nom: "a3", intitule: "b3", etablissement_formateur_siret: "c3", diplome: "d3", code_postal: "e3" },
  ]

  it("Détecte les doublons et retourne les items sans doublon ", () => {
    // @ts-ignore
    const deduplicatedList = deduplicateFormations(sampleFormation1)
    assert.strictEqual(deduplicatedList.length, 2)
    assert.strictEqual(deduplicatedList[0].nom, "a1")
    assert.strictEqual(deduplicatedList[1].nom, "a2")
  })

  it("Retourne tous les items si pas de doublons ", () => {
    // @ts-ignore
    const deduplicatedList = deduplicateFormations(sampleFormation2)

    assert.strictEqual(deduplicatedList.length, 3)
    assert.strictEqual(deduplicatedList[0].nom, "a1")
    assert.strictEqual(deduplicatedList[1].nom, "a2")
    assert.strictEqual(deduplicatedList[2].nom, "a3")
  })

  it("Retourne l'objet d'origine si tableau vide ", () => {
    const deduplicatedList = deduplicateFormations([])

    assert.strictEqual(deduplicatedList instanceof Array, true)
    assert.strictEqual(deduplicatedList.length, 0)
  })
})

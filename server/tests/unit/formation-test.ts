import assert from "assert"
import { deduplicateFormations } from "../../src/service/formations.js"
import __filename from "../../src/common/filename.js"

describe(__filename(import.meta.url), () => {
  const sampleFormation1 = [
    {
      source: { nom: "a1", intitule: "b1", etablissement_formateur_siret: "c1", diplome: "d1", code_postal: "e1" },
    },
    {
      source: { nom: "a2", intitule: "b2", etablissement_formateur_siret: "c2", diplome: "d2", code_postal: "e2" },
    },
    {
      source: { nom: "a1", intitule: "b1", etablissement_formateur_siret: "c1", diplome: "d1", code_postal: "e1" },
    },
  ]

  const sampleFormation2 = [
    {
      source: { nom: "a1", intitule: "b1", etablissement_formateur_siret: "c1", diplome: "d1", code_postal: "e1" },
    },
    {
      source: { nom: "a2", intitule: "b2", etablissement_formateur_siret: "c2", diplome: "d2", code_postal: "e2" },
    },
    {
      source: { nom: "a3", intitule: "b3", etablissement_formateur_siret: "c3", diplome: "d3", code_postal: "e3" },
    },
  ]

  it("Détecte les doublons et retourne les items sans doublon ", () => {
    const deduplicatedList = deduplicateFormations(sampleFormation1)
    assert.strictEqual(deduplicatedList.length, 2)
    assert.strictEqual(deduplicatedList[0].source.nom, "a1")
    assert.strictEqual(deduplicatedList[1].source.nom, "a2")
  })

  it("Retourne tous les items si pas de doublons ", () => {
    const deduplicatedList = deduplicateFormations(sampleFormation2)

    assert.strictEqual(deduplicatedList.length, 3)
    assert.strictEqual(deduplicatedList[0].source.nom, "a1")
    assert.strictEqual(deduplicatedList[1].source.nom, "a2")
    assert.strictEqual(deduplicatedList[2].source.nom, "a3")
  })

  it("Retourne l'objet d'origine si pas un array ", () => {
    const deduplicatedList = deduplicateFormations("not_an_array")

    assert.strictEqual(deduplicatedList, "not_an_array")
  })

  it("Retourne l'objet d'origine si tableau vide ", () => {
    const deduplicatedList = deduplicateFormations([])

    assert.strictEqual(deduplicatedList instanceof Array, true)
    assert.strictEqual(deduplicatedList.length, 0)
  })
})

import fs from "fs"
import path from "path"
import { describe, expect, it } from "vitest"
import { __dirname } from "@/common/utils/dirname"

/**
 * Garde-fou de qualité de données sur `docs/mongodb/search-synonyms.json` : un groupe
 * `equivalent` qui mélange une entrée multi-mots (phrase) avec une entrée mono-mot en
 * MAJUSCULES (≠ abréviation, toujours en minuscules dans ce jeu de données) fait exploser
 * mongot en maxClauseCount sur les requêtes longues contenant ce mot, ET pollue les
 * résultats de recherche du mot seul avec tous les autres membres du groupe (confirmé sur
 * les données de prod : "achats" seul remontait 10771 résultats via l'équivalence avec
 * "logistique", contre 640 résultats réellement pertinents — cf. #5153).
 */
describe("search-synonyms.json — pas de mot générique isolé mélangé à une phrase", () => {
  const filePath = path.resolve(__dirname(import.meta.url), "../../../../docs/mongodb/search-synonyms.json")
  const groups = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<{ mappingType: string; synonyms: string[] }>

  it("charge bien 1660+ groupes depuis le fichier", () => {
    expect(groups.length).toBeGreaterThan(1000)
  })

  it("aucun groupe ne mélange un mot isolé générique et une phrase", () => {
    const singleUpperWord = /^[A-ZÀ-Ý'-]+$/
    const offenders = groups.filter((g) => {
      const singleWords = g.synonyms.filter((s) => singleUpperWord.test(s) && s.length >= 4 && !s.includes(" "))
      const hasPhrase = g.synonyms.some((s) => s.includes(" "))
      return singleWords.length > 0 && hasPhrase
    })

    expect(offenders.map((o) => o.synonyms)).toEqual([])
  })
})

describe("search-synonyms.json — sigles ambigus (#5638)", () => {
  const filePath = path.resolve(__dirname(import.meta.url), "../../../../docs/mongodb/search-synonyms.json")
  const groups = JSON.parse(fs.readFileSync(filePath, "utf-8")) as Array<{ mappingType: string; synonyms: string[] }>
  const groupsContaining = (term: string) => groups.filter(({ synonyms }) => synonyms.some((s) => s.trim().toLowerCase() === term))

  it("aepe ne désigne que le CAP Accompagnant éducatif petite enfance", () => {
    expect(groupsContaining("aepe")).toEqual([{ mappingType: "equivalent", synonyms: ["ACCOMPAGNANT EDUCATIF PETITE ENFANCE", "aepe"] }])
  })

  // lucene.standard ne replie pas les accents : sans accent, la forme longue ne matche jamais « économique ».
  it("ape désigne Analyse et politique économique, forme longue accentuée", () => {
    expect(groupsContaining("ape")).toEqual([{ mappingType: "equivalent", synonyms: ["ANALYSE ET POLITIQUE ÉCONOMIQUE", "ape"] }])
  })
})

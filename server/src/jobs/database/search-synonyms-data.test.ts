import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

const SYNONYM_GROUPS = JSON.parse(readFileSync(new URL("../../../../docs/mongodb/search-synonyms.json", import.meta.url), "utf-8")) as Array<{ synonyms: string[] }>

const groupsContaining = (term: string) => SYNONYM_GROUPS.filter(({ synonyms }) => synonyms.some((s) => s.trim().toLowerCase() === term))

describe("docs/mongodb/search-synonyms.json", () => {
  it("aepe ne désigne que le CAP Accompagnant éducatif petite enfance (#5638)", () => {
    expect(groupsContaining("aepe")).toEqual([{ mappingType: "equivalent", synonyms: ["ACCOMPAGNANT EDUCATIF PETITE ENFANCE", "aepe"] }])
  })

  it("ape (Analyse et politique économique) n'est pas relié à la petite enfance", () => {
    const [ape, ...others] = groupsContaining("ape")

    expect(others).toEqual([])
    expect(ape.synonyms).toContain("ANALYSE ET POLITIQUE ECONOMIQUE")
    expect(ape.synonyms.map((s) => s.toLowerCase())).not.toContain("aepe")
  })
})

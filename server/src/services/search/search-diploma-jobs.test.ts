import { describe, expect, it } from "vitest"
import { buildDiplomaJobsClause } from "@/services/search/search-diploma-jobs"

const ROME_LABELS = new Map([
  ["M1203", "Comptable"],
  ["M1213", "Assistant / Assistante comptable"],
  ["M1211", "Expert-comptable / Experte-comptable"],
  ["M1206", "Responsable comptabilité"],
  ["M1607", "Secrétaire"],
  ["M1609", "Secrétaire médical / Secrétaire médicale"],
  ["M1613", "Télésecrétaire"],
  ["M1621", "Assistant / Assistante de gestion administrative"],
  ["K1303", "Garde d'enfant"],
])

const phrase = (query: string) => ({ phrase: { query, path: { value: "rome_labels", multi: "standard" }, slop: 0 } })
const branches = (clause: object | null) => (clause as { compound: { should: object[] } }).compound.should

describe("buildDiplomaJobsClause", () => {
  it("vise les intitulés ROME des codes du sigle, avec un score constant bas", () => {
    const { clause, unresolvedCodes } = buildDiplomaJobsClause("aepe", ROME_LABELS)

    expect(unresolvedCodes).toEqual(["K1310", "K1307"])
    expect(clause).toEqual({ compound: { should: [phrase("Garde d'enfant")], minimumShouldMatch: 1, score: { constant: { value: 1 } } } })
  })

  it("exclut les intitulés qui contiennent la cible : « Comptable » n'ouvre pas les experts-comptables", () => {
    const { clause } = buildDiplomaJobsClause("cg", ROME_LABELS)

    expect(branches(clause)).toContainEqual({ compound: { must: [phrase("Comptable")], mustNot: [phrase("Expert-comptable / Experte-comptable")] } })
  })

  it("n'exclut pas un intitulé englobant visé par le même sigle : « Assistant comptable » reste une cible de cg", () => {
    const { clause } = buildDiplomaJobsClause("cg", ROME_LABELS)

    expect(branches(clause)).toContainEqual(phrase("Assistant / Assistante comptable"))
    expect(JSON.stringify(branches(clause)[0])).not.toContain("Assistant / Assistante comptable")
  })

  it("near-miss : un mot qui commence par la cible (« comptabilité », « Télésecrétaire ») ne la contient pas", () => {
    const cg = JSON.stringify(buildDiplomaJobsClause("cg", ROME_LABELS).clause)
    const gpme = JSON.stringify(buildDiplomaJobsClause("gpme", ROME_LABELS).clause)

    expect(cg).not.toContain("Responsable comptabilité")
    expect(gpme).not.toContain("Télésecrétaire")
    expect(gpme).toContain("Secrétaire médical / Secrétaire médicale")
  })

  it("sigle inconnu : pas de clause", () => {
    expect(buildDiplomaJobsClause("commercial", ROME_LABELS)).toEqual({ clause: null, unresolvedCodes: [] })
  })

  it("aucun code résolu dans le référentiel : pas de clause, codes manquants remontés", () => {
    expect(buildDiplomaJobsClause("cg", new Map())).toEqual({ clause: null, unresolvedCodes: ["M1203", "M1213"] })
  })

  it("une clé héritée de Object.prototype n'est pas un sigle", () => {
    expect(buildDiplomaJobsClause("constructor", ROME_LABELS).clause).toBeNull()
  })
})

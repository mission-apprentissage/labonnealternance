import { useMongo } from "@tests/utils/mongo.test.utils"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { secteursData, up } from "@/migrations/20261116120000-seo-secteurs-lot1"

// Pages /alternance/metier existantes (ui/app/(editorial)/alternance/_components/metier_data.tsx).
const METIER_PAGES_EXISTANTES = ["developpeur-web", "developpeur-cybersecurite", "data-analyst"]

describe("migration seo-secteurs-lot1", () => {
  useMongo()

  it("crée la page informatique avec l'union dédupliquée des codes ROME", async () => {
    await up()
    const secteur = await getDbCollection("seo_secteurs").findOne({ slug: "informatique" })
    expect(secteur?.titre).toBe("Alternance informatique")
    expect(secteur?.romes).toContain("M1805")
    expect(new Set(secteur?.romes).size).toBe(secteur?.romes.length)
  })

  it("est rejouable sans doublon et recalcule les champs calculés", async () => {
    await up()
    await getDbCollection("seo_secteurs").updateOne({ slug: "informatique" }, { $set: { job_count: 42 } })
    await up()
    expect(await getDbCollection("seo_secteurs").countDocuments({ slug: "informatique" })).toBe(1)
    const secteur = await getDbCollection("seo_secteurs").findOne({ slug: "informatique" })
    expect(secteur?.job_count).toBe(0)
  })

  it("ne renvoie que vers des pages métier existantes", () => {
    const slugs = secteursData.flatMap((s) => s.metiers).flatMap((m) => (m.metier_slug ? [m.metier_slug] : []))
    expect(slugs.length).toBeGreaterThan(0)
    for (const slug of slugs) {
      expect(METIER_PAGES_EXISTANTES).toContain(slug)
    }
  })
})

import { useMongo } from "@tests/utils/mongo.test.utils"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { metierData } from "@/jobs/seo/data-metier-seo"
import { secteursData, up } from "@/migrations/20261116120000-seo-secteurs-lot1"

// `metierData` ne porte qu'une partie des pages métier publiées, les autres étant déclarées côté ui dans
// metier_data.tsx. Seules celles-ci sont liables depuis une carte : le test de périmètre ROME ci-dessous a
// besoin de leurs codes pour contraindre le compteur affiché.
const METIER_PAGES_VERIFIABLES = metierData.map((m) => m.slug)

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

  it("ne renvoie que vers des pages métier dont les codes ROME sont connus ici", () => {
    const slugs = secteursData.flatMap((s) => s.metiers).flatMap((m) => (m.metier_slug ? [m.metier_slug] : []))
    expect(slugs.length).toBeGreaterThan(0)
    for (const slug of slugs) {
      expect(METIER_PAGES_VERIFIABLES).toContain(slug)
    }
  })

  // Le compteur de la carte doit porter sur le même périmètre que la page métier vers laquelle elle renvoie.
  it("ne renvoie vers une page métier que si la carte couvre ses codes ROME", () => {
    for (const metier of secteursData.flatMap((s) => s.metiers).filter((m) => m.metier_slug)) {
      const page = metierData.find((m) => m.slug === metier.metier_slug)
      expect(page, metier.metier_slug ?? "").toBeDefined()
      for (const rome of page?.romes ?? []) {
        expect(metier.romes, `${metier.libelle} → ${metier.metier_slug}`).toContain(rome)
      }
    }
  })
})

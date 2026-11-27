import { useMongo } from "@tests/utils/mongo.test.utils"
import { SEO_METIER_PAGES } from "shared/constants/seo-metier-pages"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { secteursData, up } from "@/migrations/20261116120000-seo-secteurs-lot1"

const metiersLies = secteursData.flatMap((s) => s.metiers).filter((m) => m.metier_slug)

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

  it("ne renvoie que vers des pages métier publiées", () => {
    expect(metiersLies.length).toBeGreaterThan(0)
    const publiees = SEO_METIER_PAGES.map((p) => p.slug)
    for (const metier of metiersLies) {
      expect(publiees, `${metier.libelle} → ${metier.metier_slug}`).toContain(metier.metier_slug)
    }
  })

  // Le compteur de la carte doit porter sur le même périmètre que la page métier vers laquelle elle renvoie.
  it("ne renvoie vers une page métier que si la carte couvre ses codes ROME", () => {
    for (const metier of metiersLies) {
      const page = SEO_METIER_PAGES.find((p) => p.slug === metier.metier_slug)
      for (const rome of page?.romes ?? []) {
        expect(metier.romes, `${metier.libelle} → ${metier.metier_slug}`).toContain(rome)
      }
    }
  })
})

import { useMongo } from "@tests/utils/mongo.test.utils"
import { ObjectId } from "mongodb"
import { describe, expect, it } from "vitest"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { up } from "@/migrations/20261125120000-unset-salaire-legal-seo-diplomes-5953"

describe("migration unset-salaire-legal-seo-diplomes-5953", () => {
  useMongo()

  const diplome = (slug: string, salaire: string) => ({
    _id: new ObjectId(),
    slug,
    titre: slug,
    sousTitre: slug,
    intituleLongFormation: slug,
    romes: ["M1607"],
    kpis: { duration: "2 ans", entreprises: 0, offres: 0, salaire },
    description: { text: "", objectifs: [] },
    programme: { text: "", sections: { enseignements_generaux: [], enseignements_professionnels: [], competences_developpees: [] } },
    ecoles: [],
    metiers: { text: "", liste: [] },
    cards: [],
    created_at: new Date("2026-09-25T00:00:00.000Z"),
    updated_at: new Date("2026-09-25T00:00:00.000Z"),
  })

  it("retire les fourchettes légales figées et conserve les fourchettes propres au diplôme", async () => {
    await getDbCollection("seo_diplomes").insertMany([diplome("cap-cuisine", "504€ - 1 867€"), diplome("bts-mco", "471€ - 1 767€"), diplome("bts-cg", "1120€-1300€")])

    await up()

    const diplomes = await getDbCollection("seo_diplomes")
      .find({}, { projection: { slug: 1, kpis: 1 } })
      .toArray()
    const salaireParSlug = Object.fromEntries(diplomes.map((d) => [d.slug, d.kpis.salaire]))
    expect(salaireParSlug).toEqual({ "cap-cuisine": undefined, "bts-mco": undefined, "bts-cg": "1120€-1300€" })
    expect(diplomes.find((d) => d.slug === "cap-cuisine")?.kpis).toEqual({ duration: "2 ans", entreprises: 0, offres: 0 })
  })
})

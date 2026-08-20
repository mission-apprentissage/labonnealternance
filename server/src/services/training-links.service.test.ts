import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveDbEntity } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import { parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { zFormationCatalogueSchema } from "shared/models/index"
import { describe, expect, it } from "vitest"
import type { z } from "zod"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getLBALink, getTrainingLinks } from "./training-links.service"

useMongo()

const saveFormation = (data: Partial<z.input<typeof zFormationCatalogueSchema>>) =>
  saveDbEntity(zFormationCatalogueSchema, (item) => getDbCollection("formationcatalogues").insertOne(item), data)

const saveCommune = async () => {
  await getDbCollection("referentiel.communes").insertOne({ _id: new ObjectId(), ...parisFixture })
}

describe("getLBALink", () => {
  it("uses the formation's intitule_long, localite and geopoint when a single formation matches", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE1",
      intitule_long: "Bac Pro Boulanger",
      etablissement_formateur_localite: "Paris 6e",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    const link = await getLBALink({ id: "w1", cle_ministere_educatif: "CLE1" })
    const url = new URL(link)

    expect(url.origin + url.pathname).toBe("http://localhost:3000/recherche")
    expect(url.searchParams.get("mode")).toBe("emplois")
    expect(url.searchParams.get("q")).toBe("Bac Pro Boulanger")
    expect(url.searchParams.get("lieu_label")).toBe("Paris 6e")
    expect(url.searchParams.get("latitude")).toBe("48.86")
    expect(url.searchParams.get("longitude")).toBe("2.35")
    expect(url.searchParams.get("radius")).toBe("60")
    expect(url.searchParams.get("utm_source")).toBe("lba")
    expect(url.searchParams.has("romes")).toBe(false)
    expect(url.searchParams.has("lat")).toBe(false)
    expect(url.searchParams.has("lon")).toBe(false)
  })

  it("picks the formation closest to the wish's commune when several formations match", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_PARIS",
      etablissement_formateur_uai: "0751234A",
      intitule_long: "Formation Paris",
      etablissement_formateur_localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })
    await saveFormation({
      cle_ministere_educatif: "CLE_MARSEILLE",
      etablissement_formateur_uai: "0751234A",
      intitule_long: "Formation Marseille",
      etablissement_formateur_localite: "Marseille",
      lieu_formation_geopoint: { type: "Point", coordinates: [5.3806, 43.2803] },
    })
    await saveCommune()

    const link = await getLBALink({ id: "w2", uai_formateur: "0751234A", code_postal: "75006" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation Paris")
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
    expect(url.searchParams.get("latitude")).toBe("48.86")
    expect(url.searchParams.get("longitude")).toBe("2.35")
  })

  it("falls back to a location-only search when no formation matches but the commune is known", async () => {
    await saveCommune()

    const link = await getLBALink({ id: "w3", code_postal: "75006" })
    const url = new URL(link)

    expect(url.origin + url.pathname).toBe("http://localhost:3000/recherche")
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
    expect(url.searchParams.get("latitude")).toBe("48.8589")
    expect(url.searchParams.get("longitude")).toBe("2.347")
    expect(url.searchParams.has("q")).toBe(false)
  })

  it("falls back to the homepage when no formation and no commune are found", async () => {
    const link = await getLBALink({ id: "w4" })
    const url = new URL(link)

    expect(url.origin).toBe("http://localhost:3000")
    expect(url.pathname).toBe("/")
    expect(url.searchParams.get("utm_source")).toBe("lba")
    expect(url.searchParams.has("mode")).toBe(false)
    expect(url.searchParams.has("q")).toBe(false)
    expect(url.searchParams.has("latitude")).toBe(false)
    expect(url.searchParams.has("radius")).toBe(false)
  })
})

describe("getTrainingLinks", () => {
  it("builds a lien_lba per wish, batching formation lookups by cle_ministere_educatif", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE1",
      intitule_long: "Bac Pro Boulanger",
      etablissement_formateur_localite: "Paris 6e",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    const results = await getTrainingLinks([{ id: "w1", cle_ministere_educatif: "CLE1" }, { id: "w4" }])

    expect(results).toHaveLength(2)
    const w1 = results.find((r) => r.id === "w1")!
    const w4 = results.find((r) => r.id === "w4")!

    const w1Url = new URL(w1.lien_lba)
    expect(w1Url.searchParams.get("q")).toBe("Bac Pro Boulanger")
    expect(w1Url.searchParams.get("latitude")).toBe("48.86")

    const w4Url = new URL(w4.lien_lba)
    expect(w4Url.pathname).toBe("/")
  })
})

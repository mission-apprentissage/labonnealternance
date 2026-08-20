import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveDbEntity } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import { parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import { ZReferentielRome, zFormationCatalogueSchema } from "shared/models/index"
import { describe, expect, it } from "vitest"
import type { z } from "zod"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getLBALink, getTrainingLinks } from "./training-links.service"

useMongo()

const saveFormation = (data: Partial<z.input<typeof zFormationCatalogueSchema>>) =>
  saveDbEntity(zFormationCatalogueSchema, (item) => getDbCollection("formationcatalogues").insertOne(item), data)

const saveRome = (code_rome: string, intitule: string) =>
  saveDbEntity(ZReferentielRome, (item) => getDbCollection("referentielromes").insertOne(item), {
    rome: { code_rome, intitule, code_ogr: code_rome },
  })

const saveCommune = async () => {
  await getDbCollection("referentiel.communes").insertOne({ _id: new ObjectId(), ...parisFixture })
}

describe("getLBALink", () => {
  it("prefers the ROME label over intitule_long as q when a rome code resolves", async () => {
    await saveRome("D1102", "Boulangerie - viennoiserie")
    await saveFormation({
      cle_ministere_educatif: "CLE1",
      intitule_long: "Bac Pro Boulanger",
      rome_codes: ["D1102"],
      localite: "Paris 6e",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    const link = await getLBALink({ id: "w1", cle_ministere_educatif: "CLE1" })
    const url = new URL(link)

    expect(url.origin + url.pathname).toBe("http://localhost:3000/recherche")
    expect(url.searchParams.get("mode")).toBe("emplois")
    expect(url.searchParams.get("q")).toBe("Boulangerie - viennoiserie")
    expect(url.searchParams.get("lieu_label")).toBe("Paris 6e")
    expect(url.searchParams.get("latitude")).toBe("48.86")
    expect(url.searchParams.get("longitude")).toBe("2.35")
    expect(url.searchParams.get("radius")).toBe("60")
    expect(url.searchParams.get("source")).toBe("training_links")
    expect(url.searchParams.get("utm_source")).toBe("lba")
    expect(url.searchParams.has("romes")).toBe(false)
    expect(url.searchParams.has("lat")).toBe(false)
    expect(url.searchParams.has("lon")).toBe(false)
  })

  it("falls back to intitule_long as q when no rome code resolves to a label", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE2",
      intitule_long: "Formation sans rome connu",
      rome_codes: ["Z9999"],
      localite: "Lyon",
      lieu_formation_geopoint: { type: "Point", coordinates: [4.83, 45.75] },
    })

    const link = await getLBALink({ id: "w2", cle_ministere_educatif: "CLE2" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation sans rome connu")
  })

  it("picks the formation closest to the wish's commune when several formations match", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_PARIS",
      etablissement_formateur_uai: "0751234A",
      intitule_long: "Formation Paris",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })
    await saveFormation({
      cle_ministere_educatif: "CLE_MARSEILLE",
      etablissement_formateur_uai: "0751234A",
      intitule_long: "Formation Marseille",
      localite: "Marseille",
      lieu_formation_geopoint: { type: "Point", coordinates: [5.3806, 43.2803] },
    })
    await saveCommune()

    // "CLE_MARSEILLE" trie avant "CLE_PARIS" par ordre alphabétique : si la sélection par
    // distance ne s'appliquait pas, le pick déterministe retiendrait Marseille à tort.
    const link = await getLBALink({ id: "w3", uai_formateur: "0751234A", code_postal: "75006" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation Paris")
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
    expect(url.searchParams.get("latitude")).toBe("48.86")
    expect(url.searchParams.get("longitude")).toBe("2.35")
  })

  it("picks a deterministic formation (lowest cle_ministere_educatif) when several match and no commune is known", async () => {
    await saveFormation({
      cle_ministere_educatif: "Z_LATER",
      etablissement_formateur_uai: "0759999A",
      intitule_long: "Formation Z",
      localite: "Ville Z",
      lieu_formation_geopoint: { type: "Point", coordinates: [1, 1] },
    })
    await saveFormation({
      cle_ministere_educatif: "A_FIRST",
      etablissement_formateur_uai: "0759999A",
      intitule_long: "Formation A",
      localite: "Ville A",
      lieu_formation_geopoint: { type: "Point", coordinates: [2, 2] },
    })

    const link = await getLBALink({ id: "w4", uai_formateur: "0759999A" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation A")
    expect(url.searchParams.get("lieu_label")).toBe("Ville A")
  })

  it("keeps lieu_label consistent with the commune when the matched formation has no geopoint", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_NOGEO",
      intitule_long: "Formation sans geopoint",
      localite: "Lyon",
      lieu_formation_geopoint: null,
    })
    await saveCommune()

    const link = await getLBALink({ id: "w5", cle_ministere_educatif: "CLE_NOGEO", code_postal: "75006" })
    const url = new URL(link)

    // Les coordonnées viennent forcément de la commune (Paris) faute de geopoint sur la
    // formation : le lieu affiché doit être celui de la commune, pas "Lyon".
    expect(url.searchParams.get("latitude")).toBe("48.8589")
    expect(url.searchParams.get("longitude")).toBe("2.347")
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
  })

  it("falls back to a location-only search when no formation matches but the commune is known", async () => {
    await saveCommune()

    const link = await getLBALink({ id: "w6", code_postal: "75006" })
    const url = new URL(link)

    expect(url.origin + url.pathname).toBe("http://localhost:3000/recherche")
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
    expect(url.searchParams.get("latitude")).toBe("48.8589")
    expect(url.searchParams.get("longitude")).toBe("2.347")
    expect(url.searchParams.get("source")).toBe("training_links")
    expect(url.searchParams.has("q")).toBe(false)
  })

  it("falls back to the homepage when no formation and no commune are found", async () => {
    const link = await getLBALink({ id: "w7" })
    const url = new URL(link)

    expect(url.origin).toBe("http://localhost:3000")
    expect(url.pathname).toBe("/")
    expect(url.searchParams.get("utm_source")).toBe("lba")
    expect(url.searchParams.get("source")).toBe("training_links")
    expect(url.searchParams.has("mode")).toBe(false)
    expect(url.searchParams.has("q")).toBe(false)
    expect(url.searchParams.has("latitude")).toBe(false)
    expect(url.searchParams.has("radius")).toBe(false)
  })
})

describe("getTrainingLinks", () => {
  it("builds a lien_lba per wish, batching formation and rome lookups", async () => {
    await saveRome("D1102", "Boulangerie - viennoiserie")
    await saveFormation({
      cle_ministere_educatif: "CLE1",
      intitule_long: "Bac Pro Boulanger",
      rome_codes: ["D1102"],
      localite: "Paris 6e",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    const results = await getTrainingLinks([{ id: "w1", cle_ministere_educatif: "CLE1" }, { id: "w4" }])

    expect(results).toHaveLength(2)
    const w1 = results.find((r) => r.id === "w1")!
    const w4 = results.find((r) => r.id === "w4")!

    const w1Url = new URL(w1.lien_lba)
    expect(w1Url.searchParams.get("q")).toBe("Boulangerie - viennoiserie")
    expect(w1Url.searchParams.get("latitude")).toBe("48.86")

    const w4Url = new URL(w4.lien_lba)
    expect(w4Url.pathname).toBe("/")
  })
})

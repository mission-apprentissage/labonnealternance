import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveDbEntity } from "@tests/utils/user.test.utils"
import { ObjectId } from "bson"
import { marseilleFixture, parisFixture } from "shared/fixtures/referentiel/commune.fixture"
import type { IReferentielCommune } from "shared/models/index"
import { ZReferentielRome, zFormationCatalogueSchema } from "shared/models/index"
import { describe, expect, it } from "vitest"
import type { z } from "zod"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getLBALink, getTrainingLinks, sanitizeWish } from "./training-links.service"

useMongo()

const saveFormation = (data: Partial<z.input<typeof zFormationCatalogueSchema>>) =>
  saveDbEntity(zFormationCatalogueSchema, (item) => getDbCollection("formationcatalogues").insertOne(item), data)

const saveRome = (code_rome: string, intitule: string) =>
  saveDbEntity(ZReferentielRome, (item) => getDbCollection("referentielromes").insertOne(item), {
    rome: { code_rome, intitule, code_ogr: code_rome },
  })

const saveCommune = async (fixture: Omit<IReferentielCommune, "_id"> = parisFixture) => {
  await getDbCollection("referentiel.communes").insertOne({ _id: new ObjectId(), ...fixture })
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
    // Pas de commune sur le vœu : la localisation de la formation n'est jamais reprise dans le lien.
    expect(url.searchParams.has("lieu_label")).toBe(false)
    expect(url.searchParams.has("latitude")).toBe(false)
    expect(url.searchParams.has("longitude")).toBe(false)
    expect(url.searchParams.has("radius")).toBe(false)
    expect(url.searchParams.get("search_source")).toBe("training_links")
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
      rncp_code: "RNCP12345",
      intitule_long: "Formation Paris",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })
    await saveFormation({
      cle_ministere_educatif: "CLE_MARSEILLE",
      etablissement_formateur_uai: "0751234A",
      rncp_code: "RNCP12345",
      intitule_long: "Formation Marseille",
      localite: "Marseille",
      lieu_formation_geopoint: { type: "Point", coordinates: [5.3806, 43.2803] },
    })
    await saveCommune()

    // "CLE_MARSEILLE" trie avant "CLE_PARIS" par ordre alphabétique : si la sélection par
    // distance ne s'appliquait pas, le pick déterministe retiendrait Marseille à tort.
    const link = await getLBALink({ id: "w3", uai_formateur: "0751234A", rncp: "RNCP12345", code_postal: "75006" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation Paris")
    // La localisation vient de la commune du vœu, pas du geopoint de la formation retenue.
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
    expect(url.searchParams.get("latitude")).toBe("48.8589")
    expect(url.searchParams.get("longitude")).toBe("2.347")
    expect(url.searchParams.get("radius")).toBe("60")
  })

  it("picks a deterministic formation (lowest cle_ministere_educatif) when several match and no commune is known", async () => {
    await saveFormation({
      cle_ministere_educatif: "Z_LATER",
      etablissement_formateur_uai: "0759999A",
      rncp_code: "RNCP12345",
      intitule_long: "Formation Z",
      localite: "Ville Z",
      lieu_formation_geopoint: { type: "Point", coordinates: [1, 1] },
    })
    await saveFormation({
      cle_ministere_educatif: "A_FIRST",
      etablissement_formateur_uai: "0759999A",
      rncp_code: "RNCP12345",
      intitule_long: "Formation A",
      localite: "Ville A",
      lieu_formation_geopoint: { type: "Point", coordinates: [2, 2] },
    })

    const link = await getLBALink({ id: "w4", uai_formateur: "0759999A", rncp: "RNCP12345" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation A")
    expect(url.searchParams.has("lieu_label")).toBe(false)
  })

  it("returns no formation when the wish carries no cfd, rncp nor mef, even with a known UAI", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_UAI_SEUL",
      etablissement_formateur_uai: "0758888B",
      intitule_long: "Formation du CFA",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    // L'UAI seul retiendrait un métier arbitraire parmi ceux de l'établissement.
    const link = await getLBALink({ id: "w4b", uai_formateur: "0758888B", uai_formateur_responsable: "0758888B" })
    const url = new URL(link)

    expect(url.pathname).toBe("/")
    expect(url.searchParams.has("q")).toBe(false)
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

    // Les coordonnées et le lieu affiché viennent de la commune du vœu (Paris), jamais de la
    // formation : pas "Lyon".
    expect(url.searchParams.get("latitude")).toBe("48.8589")
    expect(url.searchParams.get("longitude")).toBe("2.347")
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
  })

  it("falls back to any formation matching the identifiers when the establishment does not offer it", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_AILLEURS",
      etablissement_formateur_uai: "0690000Z",
      rncp_code: "RNCP11111",
      intitule_long: "Formation ailleurs",
      localite: "Lyon",
      lieu_formation_geopoint: { type: "Point", coordinates: [4.83, 45.75] },
    })

    // L'UAI du vœu n'a aucune formation au catalogue : la requête UAI + RNCP est vide, mais le RNCP
    // est connu ailleurs, on retient le métier visé plutôt qu'une recherche sans métier.
    const link = await getLBALink({ id: "w8", uai_formateur: "0751111B", rncp: "RNCP11111" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation ailleurs")
    // Le lieu de la formation trouvée ailleurs n'est pas repris : sans commune, métier seul.
    expect(url.searchParams.has("lieu_label")).toBe(false)
    expect(url.searchParams.has("latitude")).toBe(false)
  })

  it("does not fall back to the establishment's other formations when the identifiers match nothing", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_CFA",
      etablissement_formateur_uai: "0751111B",
      rncp_code: "RNCP11111",
      intitule_long: "Formation du CFA",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    // RNCP inconnu du catalogue : retomber sur les formations du CFA pointerait un métier arbitraire.
    const link = await getLBALink({ id: "w8b", uai_formateur: "0751111B", rncp: "RNCP99999" })
    const url = new URL(link)

    expect(url.pathname).toBe("/")
    expect(url.searchParams.has("q")).toBe(false)
  })

  it("prefers the gestionnaire matching the identifiers over the identifiers alone", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_AILLEURS",
      etablissement_formateur_uai: "0690000Z",
      rncp_code: "RNCP00002",
      intitule_long: "Formation ailleurs",
      localite: "Lyon",
      lieu_formation_geopoint: { type: "Point", coordinates: [4.83, 45.75] },
    })
    await saveFormation({
      cle_ministere_educatif: "CLE_GESTIONNAIRE",
      etablissement_gestionnaire_uai: "0753333D",
      rncp_code: "RNCP00002",
      intitule_long: "Formation du gestionnaire",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    const link = await getLBALink({ id: "w8c", uai_formateur: "0752222C", uai_formateur_responsable: "0753333D", rncp: "RNCP00002" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation du gestionnaire")
  })

  it("prefers the gestionnaire matching the identifiers over the formateur alone", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_FORMATEUR",
      etablissement_formateur_uai: "0752222C",
      rncp_code: "RNCP00001",
      intitule_long: "Autre formation du formateur",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })
    await saveFormation({
      cle_ministere_educatif: "CLE_GESTIONNAIRE",
      etablissement_gestionnaire_uai: "0753333D",
      rncp_code: "RNCP00002",
      intitule_long: "Formation du gestionnaire",
      localite: "Lyon",
      lieu_formation_geopoint: { type: "Point", coordinates: [4.83, 45.75] },
    })

    const link = await getLBALink({ id: "w9", uai_formateur: "0752222C", uai_formateur_responsable: "0753333D", rncp: "RNCP00002" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation du gestionnaire")
  })

  it("prefers the formateur matching the identifiers over the gestionnaire matching them", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_FORMATEUR",
      etablissement_formateur_uai: "0752222C",
      rncp_code: "RNCP00002",
      intitule_long: "Formation du formateur",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })
    await saveFormation({
      cle_ministere_educatif: "CLE_GESTIONNAIRE",
      etablissement_gestionnaire_uai: "0753333D",
      rncp_code: "RNCP00002",
      intitule_long: "Formation du gestionnaire",
      localite: "Lyon",
      lieu_formation_geopoint: { type: "Point", coordinates: [4.83, 45.75] },
    })

    const link = await getLBALink({ id: "w10", uai_formateur: "0752222C", uai_formateur_responsable: "0753333D", rncp: "RNCP00002" })
    const url = new URL(link)

    expect(url.searchParams.get("q")).toBe("Formation du formateur")
  })

  it("falls back to a location-only search when no formation matches but the commune is known", async () => {
    await saveCommune()

    const link = await getLBALink({ id: "w6", code_postal: "75006" })
    const url = new URL(link)

    expect(url.origin + url.pathname).toBe("http://localhost:3000/recherche")
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
    expect(url.searchParams.get("latitude")).toBe("48.8589")
    expect(url.searchParams.get("longitude")).toBe("2.347")
    expect(url.searchParams.get("search_source")).toBe("training_links")
    expect(url.searchParams.has("q")).toBe(false)
  })

  it("restores the leading zero of a 4-digit postal code before resolving the commune", async () => {
    await saveCommune({
      ...parisFixture,
      code: "06088",
      codeDepartement: "06",
      codesPostaux: ["06000", "06100", "06200", "06300"],
      nom: "Nice",
      centre: { type: "Point", coordinates: [7.27, 43.7] },
    })

    // Export tableur : "06000" est devenu "6000".
    const link = await getLBALink({ id: "w6b", code_postal: "6000" })
    const url = new URL(link)

    expect(url.searchParams.get("lieu_label")).toBe("Nice")
    expect(url.searchParams.get("latitude")).toBe("43.7")
  })

  it("falls back to the main commune of the departement when the postal code is unknown (CEDEX)", async () => {
    await saveCommune(marseilleFixture)
    await saveCommune({
      ...parisFixture,
      code: "13001",
      codeDepartement: "13",
      codesPostaux: ["13100"],
      nom: "Aix-en-Provence",
      centre: { type: "Point", coordinates: [5.45, 43.53] },
    })

    // 13284 (Marseille CEDEX 07) n'est pas un code postal et 13000 n'existe pas : la commune du 13 qui
    // porte le plus de codes postaux est retenue.
    const link = await getLBALink({ id: "w6c", code_postal: "13284" })
    const url = new URL(link)

    expect(url.searchParams.get("lieu_label")).toBe("Marseille")
    expect(url.searchParams.get("latitude")).toBe("43.2803")
  })

  it("falls back to the homepage when no formation and no commune are found", async () => {
    const link = await getLBALink({ id: "w7" })
    const url = new URL(link)

    expect(url.origin).toBe("http://localhost:3000")
    expect(url.pathname).toBe("/")
    expect(url.searchParams.get("utm_source")).toBe("lba")
    expect(url.searchParams.get("search_source")).toBe("training_links")
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
    expect(w1Url.searchParams.has("latitude")).toBe(false)

    const w4Url = new URL(w4.lien_lba)
    expect(w4Url.pathname).toBe("/")
  })

  it("truncates an 11-character MEF to the 10-digit mef10 indexed in the catalogue", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_MEF_OK",
      etablissement_formateur_uai: "0754444E",
      bcn_mefs_10: [{ mef10: "2412322421" }],
      intitule_long: "Formation MEF attendu",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })
    await saveFormation({
      cle_ministere_educatif: "CLE_MEF_AUTRE",
      etablissement_formateur_uai: "0754444E",
      bcn_mefs_10: [{ mef10: "2413361621" }],
      intitule_long: "Formation MEF autre",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    const [result] = await getTrainingLinks([{ id: "w1", uai_formateur: "0754444E", mef: "24123224210" }])
    const url = new URL(result.lien_lba)

    expect(url.searchParams.get("q")).toBe("Formation MEF attendu")
  })

  it("nullifies a non-numeric MEF instead of failing and, without any identifier left, falls back to the commune", async () => {
    await saveFormation({
      cle_ministere_educatif: "CLE_AFFECTATION",
      etablissement_formateur_uai: "0755555F",
      bcn_mefs_10: [{ mef10: "2412322421" }],
      intitule_long: "Formation du CFA",
      localite: "Paris",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })
    await saveCommune()

    const [result] = await getTrainingLinks([{ id: "w1", uai_formateur: "0755555F", mef: "AFFECTATION", code_postal: "75006" }])
    const url = new URL(result.lien_lba)

    expect(url.pathname).toBe("/recherche")
    expect(url.searchParams.has("q")).toBe(false)
    expect(url.searchParams.get("lieu_label")).toBe("Paris")
  })

  it("returns one result per wish, in input order, across parallel groups", async () => {
    await saveRome("D1102", "Boulangerie - viennoiserie")
    await saveFormation({
      cle_ministere_educatif: "CLE1",
      intitule_long: "Bac Pro Boulanger",
      rome_codes: ["D1102"],
      localite: "Paris 6e",
      lieu_formation_geopoint: { type: "Point", coordinates: [2.35, 48.86] },
    })

    // Plus que la taille d'un groupe parallèle (10), en alternant vœux résolus (durée variable :
    // lookups formation + rome) et vœux vides (immédiats) pour désynchroniser les complétions
    const wishes = Array.from({ length: 25 }, (_, i) => (i % 2 === 0 ? { id: `w${i}`, cle_ministere_educatif: "CLE1" } : { id: `w${i}` }))

    const results = await getTrainingLinks(wishes)

    expect(results.map((r) => r.id)).toEqual(wishes.map((w) => w.id))

    for (const [i, result] of results.entries()) {
      const url = new URL(result.lien_lba)
      if (i % 2 === 0) {
        expect(url.searchParams.get("q")).toBe("Boulangerie - viennoiserie")
      } else {
        expect(url.pathname).toBe("/")
      }
    }
  })
})

describe("sanitizeWish", () => {
  it("truncates a numeric MEF to 10 digits and keeps a 10-digit MEF as is", () => {
    expect(sanitizeWish({ id: "w", mef: "24123224210" }).mef).toBe("2412322421")
    expect(sanitizeWish({ id: "w", mef: " 2412322421 " }).mef).toBe("2412322421")
  })

  it("nullifies a MEF that is not 10 or 11 digits", () => {
    expect(sanitizeWish({ id: "w", mef: "AFFECTATION" }).mef).toBeNull()
    expect(sanitizeWish({ id: "w", mef: "2412322" }).mef).toBeNull()
    expect(sanitizeWish({ id: "w", mef: "2412322421A" }).mef).toBeNull()
    expect(sanitizeWish({ id: "w", mef: "" }).mef).toBeNull()
  })

  it("trims text identifiers and nullifies empty ones without touching the others", () => {
    const wish = sanitizeWish({ id: "w", cle_ministere_educatif: " CLE1 ", rncp: "", uai_formateur: "0751234A", cfd: undefined })

    expect(wish.id).toBe("w")
    expect(wish.cle_ministere_educatif).toBe("CLE1")
    expect(wish.rncp).toBeNull()
    expect(wish.cfd).toBeNull()
    expect(wish.uai_formateur).toBe("0751234A")
  })
})

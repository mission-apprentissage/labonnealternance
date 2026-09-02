import { useMongo } from "@tests/utils/mongo.test.utils"
import nock from "nock"
import type { IDiagorienteClassificationResponseSchema } from "shared"
import { cacheDiagorienteFixture } from "shared/fixtures/cache-diagoriente.fixture"
import { afterEach, describe, expect, it } from "vitest"
import { nockDiagorienteAccessToken, nockDiagorienteRomeClassifier } from "@/common/apis/diagoriente/diagoriente.client.fixture"
import { getDbCollection } from "@/common/utils/mongodb-utils"
import { getRomesInfosFromDiagoriente } from "./cache-diagoriente.service"

const sector = "Commerce de détail d'habillement en magasin spécialisé"

const apiResult = (rome: string, titre: string) => ({
  classify_results: [{ data: { _key: "key", item_version_id: "version_id", item_id: "item_id", titre, valid_from: "2024-01-01", valid_to: null, item_type: "SousDomaine", rome } }],
})

describe("getRomesInfosFromDiagoriente", () => {
  useMongo()

  afterEach(() => {
    nock.cleanAll()
  })

  it("groupe mixte : les requêtes en cache gardent leur ROME quand une autre requête du groupe part vers l'API", async () => {
    // Régression prod : le résultat final indexait le tableau des ROME cachés par l'id Mongo de la
    // requête (toujours undefined) au lieu de sa position. Dès qu'un groupe de 100 contenait une
    // requête hors cache, toutes celles en cache ressortaient à null — 856 offres en erreur au nightly
    // du 02/09/2026, toutes reservies depuis le cache à 06h03 sans appel API.
    await getDbCollection("cache_diagoriente").insertOne(cacheDiagorienteFixture({ title: "Cuisinier", sector, code_rome: "G1602", intitule_rome: "Cuisinier" }))
    const apiResponse: IDiagorienteClassificationResponseSchema = { b: apiResult("D1214", "Vendeur") }
    nockDiagorienteAccessToken()
    const classifier = nockDiagorienteRomeClassifier([{ title: "Vendeur", sector, description: "desc b", id: "b" }], apiResponse)

    const romes = await getRomesInfosFromDiagoriente([
      { id: "a", title: "Cuisinier", sector, description: "desc a" },
      { id: "b", title: "Vendeur", sector, description: "desc b" },
      { id: "c", title: "Cuisinier", sector, description: "autre description, même couple titre/secteur" },
    ])

    expect.soft(romes).toEqual(["G1602", "D1214", "G1602"])
    // Seule la requête hors cache est envoyée à Diagoriente (le nock ne matche que ce payload).
    expect.soft(classifier.isDone()).toBe(true)
    // Le résultat API est mis en cache pour les nuits suivantes.
    const cached = await getDbCollection("cache_diagoriente").findOne({ title: "Vendeur", sector })
    expect(cached).toMatchObject({ code_rome: "D1214", intitule_rome: "Vendeur" })
  })

  it("tout en cache : aucun appel API", async () => {
    await getDbCollection("cache_diagoriente").insertOne(cacheDiagorienteFixture({ title: "Cuisinier", sector, code_rome: "G1602" }))
    // Aucun nock : un appel réseau échouerait (nock désactive les connexions non interceptées).

    const romes = await getRomesInfosFromDiagoriente([{ id: "a", title: "Cuisinier", sector, description: "desc a" }])

    expect(romes).toEqual(["G1602"])
  })

  it("requête sans réponse Diagoriente : null, rien n'est mis en cache, les autres réponses du groupe sont conservées", async () => {
    const apiResponse: IDiagorienteClassificationResponseSchema = { b: apiResult("D1214", "Vendeur") }
    nockDiagorienteAccessToken()
    nockDiagorienteRomeClassifier(
      [
        { title: "Titre inclassable", sector, description: "desc a", id: "a" },
        { title: "Vendeur", sector, description: "desc b", id: "b" },
      ],
      apiResponse
    )

    const romes = await getRomesInfosFromDiagoriente([
      { id: "a", title: "Titre inclassable", sector, description: "desc a" },
      { id: "b", title: "Vendeur", sector, description: "desc b" },
    ])

    expect.soft(romes).toEqual([null, "D1214"])
    expect(await getDbCollection("cache_diagoriente").countDocuments({ title: "Titre inclassable" })).toBe(0)
  })
})

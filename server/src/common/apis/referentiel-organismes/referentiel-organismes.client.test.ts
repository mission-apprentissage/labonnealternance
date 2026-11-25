import nock from "nock"
import { afterEach, beforeEach, describe, expect, it } from "vitest"

import { getReferentielOrganismePresence, getReferentielOrganismesSirets } from "./referentiel-organismes.client"

const ORIGIN = "https://referentiel.apprentissage.onisep.fr"
const SIRET = "35306634300016"

const page = (sirets: string[], { page = 1, nombre_de_page = 1, total = sirets.length } = {}) => ({
  pagination: { page, resultats_par_page: 20000, nombre_de_page, total },
  organismes: sirets.map((siret) => ({ siret })),
})

describe("referentiel-organismes.client", () => {
  beforeEach(() => {
    nock.disableNetConnect()
  })
  afterEach(() => {
    nock.cleanAll()
    nock.enableNetConnect()
  })

  describe("getReferentielOrganismesSirets", () => {
    it("renvoie les SIRET de la liste, en ne demandant que le champ siret", async () => {
      nock(ORIGIN)
        .get("/api/v1/organismes")
        .query({ page: "1", items_par_page: "20000", champs: "siret" })
        .reply(200, page(["1", "2"]))

      expect(await getReferentielOrganismesSirets()).toEqual(new Set(["1", "2"]))
    })

    it("lit toutes les pages quand l'API plafonne leur taille", async () => {
      nock(ORIGIN)
        .get("/api/v1/organismes")
        .query((q) => q.page === "1")
        .reply(200, page(["1", "2"], { nombre_de_page: 2, total: 3 }))
      nock(ORIGIN)
        .get("/api/v1/organismes")
        .query((q) => q.page === "2")
        .reply(200, page(["3"], { page: 2, nombre_de_page: 2, total: 3 }))

      expect(await getReferentielOrganismesSirets()).toEqual(new Set(["1", "2", "3"]))
    })

    it("échoue si la liste reçue ne couvre pas le total annoncé", async () => {
      nock(ORIGIN)
        .get("/api/v1/organismes")
        .query(true)
        .reply(200, page(["1", "2"], { total: 3 }))

      await expect(getReferentielOrganismesSirets()).rejects.toThrow("2 SIRET distincts reçus pour un total annoncé de 3")
    })

    it("échoue si des doublons masquent un SIRET manquant", async () => {
      nock(ORIGIN)
        .get("/api/v1/organismes")
        .query(true)
        .reply(200, page(["1", "1"], { total: 2 }))

      await expect(getReferentielOrganismesSirets()).rejects.toThrow("1 SIRET distincts reçus pour un total annoncé de 2")
    })

    it("échoue si le total change entre deux pages", async () => {
      nock(ORIGIN)
        .get("/api/v1/organismes")
        .query((q) => q.page === "1")
        .reply(200, page(["1"], { nombre_de_page: 2, total: 2 }))
      nock(ORIGIN)
        .get("/api/v1/organismes")
        .query((q) => q.page === "2")
        .reply(200, page(["2"], { page: 2, nombre_de_page: 2, total: 3 }))

      await expect(getReferentielOrganismesSirets()).rejects.toThrow("total passé de 2 à 3")
    })

    it("échoue sur une réponse sans pagination", async () => {
      nock(ORIGIN).get("/api/v1/organismes").query(true).reply(200, { organismes: [] })

      await expect(getReferentielOrganismesSirets()).rejects.toThrow()
    })

    it("échoue sur une erreur HTTP", async () => {
      nock(ORIGIN).get("/api/v1/organismes").query(true).reply(503)

      await expect(getReferentielOrganismesSirets()).rejects.toThrow()
    })
  })

  describe("getReferentielOrganismePresence", () => {
    it("présent sur un 200 qui porte le SIRET demandé", async () => {
      nock(ORIGIN).get(`/api/v1/organismes/${SIRET}`).reply(200, { siret: SIRET, etat_administratif: "fermé", qualiopi: false })

      expect(await getReferentielOrganismePresence(SIRET)).toEqual({ kind: "present" })
    })

    it("absent sur un 404", async () => {
      nock(ORIGIN).get(`/api/v1/organismes/${SIRET}`).reply(404, { statusCode: 404, error: "Not Found", message: "Siret inconnu" })

      expect(await getReferentielOrganismePresence(SIRET)).toEqual({ kind: "absent" })
    })

    it.each([
      ["un 200 sans SIRET", 200, {}, "réponse 200 illisible"],
      ["un 200 sur un autre SIRET", 200, { siret: "35306634300024" }, "réponse 200 illisible"],
      ["un 500", 500, {}, "HTTP 500"],
      ["un 400", 400, {}, "HTTP 400"],
    ])("erreur, jamais absent, sur %s", async (_label, status, body, reason) => {
      nock(ORIGIN).get(`/api/v1/organismes/${SIRET}`).reply(status, body)

      expect(await getReferentielOrganismePresence(SIRET)).toEqual({ kind: "error", reason })
    })

    it("erreur sur une absence de réponse", async () => {
      nock(ORIGIN).get(`/api/v1/organismes/${SIRET}`).replyWithError("socket hang up")

      expect(await getReferentielOrganismePresence(SIRET)).toEqual({ kind: "error", reason: "sans réponse" })
    })
  })
})

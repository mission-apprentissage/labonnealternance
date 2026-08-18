import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { generateSearchItemFixture } from "shared/fixtures/search-items.fixture"
import { describe, expect, it, vi } from "vitest"

import * as mongodbUtils from "@/common/utils/mongodb-utils"
import { getDbCollection } from "@/common/utils/mongodb-utils"

// Intercepte les appels `aggregate` sur search_items pour simuler un échec mongot précis
// (même pattern que search.service.test.ts), sans toucher au reste de la stack.
function mockFirstAggregateCallToFail(errorMessage: string) {
  const getDbCollectionOriginal = mongodbUtils.getDbCollection
  let aggregateCalls = 0
  return vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation((name) => {
    const collection = getDbCollectionOriginal(name)
    if (name !== "search_items") return collection
    return new Proxy(collection, {
      get(target, prop, receiver) {
        if (prop === "aggregate") {
          return (...args: Parameters<typeof collection.aggregate>) => {
            aggregateCalls++
            if (aggregateCalls === 1) {
              return { toArray: () => Promise.reject(new Error(errorMessage)) }
            }
            return target.aggregate(...args)
          }
        }
        const value = Reflect.get(target, prop, receiver)
        return typeof value === "function" ? value.bind(target) : value
      },
    }) as typeof collection
  })
}

describe("search.controller", () => {
  useMongo()
  const httpClient = useServer()

  describe("GET /v1/search", () => {
    describe("validation", () => {
      it("retourne 200 avec la structure attendue même sans données", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search" })

        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body).toHaveProperty("hits")
        expect(body).toHaveProperty("nbHits")
        expect(body).toHaveProperty("page")
        expect(body).toHaveProperty("nbPages")
        expect(Array.isArray(body.hits)).toBe(true)
      })

      it("retourne 400 si hitsPerPage dépasse 100", async () => {
        const response = await httpClient().inject({
          method: "GET",
          path: "/api/v1/search?hitsPerPage=200",
        })

        expect(response.statusCode).toBe(400)
      })

      it("retourne 400 si page est négatif", async () => {
        const response = await httpClient().inject({
          method: "GET",
          path: "/api/v1/search?page=-1",
        })

        expect(response.statusCode).toBe(400)
      })

      it("applique les valeurs par défaut (page=0, hitsPerPage=20, radius=30)", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search" })

        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body.page).toBe(0)
      })

      it("retourne 400 si hitsPerPage vaut 0 (min 1)", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?hitsPerPage=0" })

        expect(response.statusCode).toBe(400)
      })

      it("accepte hitsPerPage=100 (borne max)", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?hitsPerPage=100" })

        expect(response.statusCode).toBe(200)
      })

      it("retourne 400 si radius n'est pas numérique", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?radius=abc" })

        expect(response.statusCode).toBe(400)
      })

      it("retourne 400 si latitude n'est pas numérique", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?latitude=paris" })

        expect(response.statusCode).toBe(400)
      })

      it("retourne 400 sur un paramètre inconnu (querystring strict)", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?foo=bar" })

        expect(response.statusCode).toBe(400)
      })

      it("retourne 400 si sort a une valeur hors enum", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?sort=zzz" })

        expect(response.statusCode).toBe(400)
      })

      it.each(["proximity", "date", "applications", "start_date"])("accepte sort=%s", async (sort) => {
        const response = await httpClient().inject({ method: "GET", path: `/api/v1/search?sort=${sort}&latitude=48.86&longitude=2.35` })

        expect(response.statusCode).toBe(200)
      })
    })

    // mongot tourne en CI (cf. ci.yml « start mongot service ») mais les bases de test
    // n'ont pas de search index → $search répond vide, ce qui suffit à exercer le pipeline.
    describe("réponse sans search index ($search répond vide)", () => {
      it("retourne des hits vides si la collection est vide", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search" })

        expect(response.statusCode).toBe(200)
        expect(response.json().hits).toHaveLength(0)
        expect(response.json().nbHits).toBe(0)
        expect(response.json().nbPages).toBe(0)
      })

      it("accepte tous les paramètres de filtre sans erreur", async () => {
        const doc = generateSearchItemFixture()
        await getDbCollection("search_items").insertOne(doc)

        const response = await httpClient().inject({
          method: "GET",
          path: "/api/v1/search?q=test&type=offre&contract_type=Apprentissage&level=5&activity_sector=Informatique&organization_name=Corp&sort=date&latitude=48.86&longitude=2.35&radius=20&page=0&hitsPerPage=10",
        })

        expect(response.statusCode).toBe(200)
        const body = response.json()
        expect(body).toHaveProperty("hits")
        expect(body).toHaveProperty("nbHits")
        expect(body).toHaveProperty("page", 0)
        expect(body).toHaveProperty("nbPages")
      })

      it("accepte contract_type passé plusieurs fois", async () => {
        const response = await httpClient().inject({
          method: "GET",
          path: "/api/v1/search?contract_type=Apprentissage&contract_type=Contrat+pro",
        })

        expect(response.statusCode).toBe(200)
      })
    })

    describe("log search_queries (#5153/#5166)", () => {
      // logSearchQuery est fire-and-forget (jamais awaited par le contrôleur, cf. commentaire
      // search.controller.ts) : l'insert peut atterrir après que inject() a résolu la réponse.
      const waitForLoggedQuery = (q: string) =>
        vi.waitFor(
          async () => {
            const doc = await getDbCollection("search_queries").findOne({ q })
            expect(doc).not.toBeNull()
            return doc!
          },
          { timeout: 1000, interval: 20 }
        )

      it("logue status=ok sur une recherche réussie", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?q=développeur&page=0" })
        expect(response.statusCode).toBe(200)

        const doc = await waitForLoggedQuery("développeur")
        expect(doc).toMatchObject({ status: "ok", nb_hits: 0 })
      })

      it("ne logue pas une requête interne ni une page > 0", async () => {
        const response1 = await httpClient().inject({ method: "GET", path: "/api/v1/search?q=interne&page=0&internal=true" })
        const response2 = await httpClient().inject({ method: "GET", path: "/api/v1/search?q=page1&page=1" })
        expect(response1.statusCode).toBe(200)
        expect(response2.statusCode).toBe(200)

        // Laisse une marge à un éventuel (faux) log fire-and-forget avant de conclure à son absence.
        await new Promise((resolve) => setTimeout(resolve, 100))
        expect(await getDbCollection("search_queries").findOne({ q: "interne" })).toBeNull()
        expect(await getDbCollection("search_queries").findOne({ q: "page1" })).toBeNull()
      })

      it("logue status=degraded quand searchItems replie après un dépassement de maxClauseCount", async () => {
        const spy = mockFirstAggregateCallToFail("Query exceeded maxClauseCount")

        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?q=degraded&page=0" })
        expect(response.statusCode).toBe(200)
        spy.mockRestore()

        const doc = await waitForLoggedQuery("degraded")
        expect(doc).toMatchObject({ status: "degraded", nb_hits: 0 })
      })

      it("logue status=error, nb_hits=null et renvoie 500 quand searchItems échoue", async () => {
        const getDbCollectionOriginal = mongodbUtils.getDbCollection
        const spy = vi.spyOn(mongodbUtils, "getDbCollection").mockImplementation((name) => {
          if (name !== "search_items") return getDbCollectionOriginal(name)
          throw new Error("boom")
        })

        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search?q=erreur&page=0" })
        expect(response.statusCode).toBe(500)
        spy.mockRestore()

        const doc = await waitForLoggedQuery("erreur")
        expect(doc).toMatchObject({ status: "error", nb_hits: null })
      })
    })
  })
})

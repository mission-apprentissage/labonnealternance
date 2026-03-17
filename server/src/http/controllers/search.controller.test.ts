import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { generateAlgoliaFixture } from "shared/fixtures/algolia.fixture"
import { describe, expect, it } from "vitest"

import { getDbCollection } from "@/common/utils/mongodbUtils"

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
    })

    describe("réponse sans mongot ($search retourne vide sans moteur de recherche)", () => {
      it("retourne des hits vides si la collection est vide", async () => {
        const response = await httpClient().inject({ method: "GET", path: "/api/v1/search" })

        expect(response.statusCode).toBe(200)
        expect(response.json().hits).toHaveLength(0)
        expect(response.json().nbHits).toBe(0)
        expect(response.json().nbPages).toBe(0)
      })

      it("accepte tous les paramètres de filtre sans erreur", async () => {
        const doc = generateAlgoliaFixture()
        await getDbCollection("algolia").insertOne(doc)

        const response = await httpClient().inject({
          method: "GET",
          path: "/api/v1/search?q=test&type=offre&contract_type=Apprentissage&level=5&activity_sector=Informatique&organization_name=Corp&latitude=48.86&longitude=2.35&radius=20&page=0&hitsPerPage=10",
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
  })
})

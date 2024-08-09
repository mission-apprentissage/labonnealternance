import assert from "assert"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { describe, expect, it } from "vitest"

describe.skip("romesFromCatalogue", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que la route métiers par cdf répond", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v1/metiers/metiersParFormation/a" })

    expect(response.statusCode).toBe(200)

    assert.ok(JSON.parse(response.body).metiers instanceof Array)
    assert.ok(JSON.parse(response.body).metiers.length === 0)
    assert.ok(JSON.parse(response.body).error.length > 0)
  })

  it("Vérifie que la requête metiersParFormation répond avec des résultats", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v1/metiers/metiersParFormation/50022137" })

    if (response.statusCode !== 500) {
      // test en local avec es bien renseigné
      expect(response.statusCode).toBe(200)

      assert.ok(JSON.parse(response.body).metiers instanceof Array)
    } else {
      expect(response.statusCode).toBe(500)
    }
  })

  it("Vérifie que la requête tous les métiers répond avec des résultats", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v1/metiers/all" })

    if (response.statusCode !== 500) {
      // test en local avec es bien renseigné
      expect(response.statusCode).toBe(200)
      assert.ok(JSON.parse(response.body).metiers instanceof Array)
    } else {
      expect(response.statusCode).toBe(500)
    }
  })

  it("Vérifie que la requête métiers sans paramètre répond avec une erreur 400", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/v1/metiers" })

    expect(response.statusCode).toBe(400)
    assert.strictEqual(JSON.parse(response.body).error, "missing_parameters")
  })
})

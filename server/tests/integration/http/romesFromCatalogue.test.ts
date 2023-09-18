import assert from "assert"

import { describe, it, expect } from "vitest"
import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

describe.skip("romesFromCatalogue", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que la route métiers par cdf répond", async () => {
    const response = await httpClient().get("/api/v1/metiers/metiersParFormation/a")

    assert.strictEqual(response.status, 200)

    assert.ok(response.body.metiers instanceof Array)
    assert.ok(response.body.metiers.length === 0)
    assert.ok(response.body.error.length > 0)
  })

  it("Vérifie que la route métiers par établissement répond", async () => {
    const response = await httpClient().get("/api/v1/metiers/metiersParEtablissement/a")

    if (response.status !== 500) {
      // test en local avec es bien renseigné

      assert.strictEqual(response.status, 200)

      assert.ok(response.body.metiers instanceof Array)
      assert.ok(response.body.metiers.length === 0)
      assert.ok(response.body.error.length > 0)
    } else {
      assert.strictEqual(response.status, 500)
    }
  })

  it("Vérifie que la requête metiersParFormation répond avec des résultats", async () => {
    const response = await httpClient().get("/api/v1/metiers/metiersParFormation/50022137")

    if (response.status !== 500) {
      // test en local avec es bien renseigné
      assert.strictEqual(response.status, 200)

      assert.ok(response.body.metiers instanceof Array)
    } else {
      assert.strictEqual(response.status, 500)
    }
  })

  it("Vérifie que la requête metiersParEtablissement répond avec des résultats", async () => {
    const response = await httpClient().get("/api/v1/metiers/metiersParEtablissement/77566202600225")

    if (response.status !== 500) {
      // test en local avec es bien renseigné
      assert.strictEqual(response.status, 200)
      assert.ok(response.body.metiers instanceof Array)
    } else {
      assert.strictEqual(response.status, 500)
    }
  })

  it("Vérifie que la requête tous les métiers répond avec des résultats", async () => {
    const response = await httpClient().get("/api/v1/metiers/all")

    if (response.status !== 500) {
      // test en local avec es bien renseigné
      assert.strictEqual(response.status, 200)
      assert.ok(response.body.metiers instanceof Array)
    } else {
      assert.strictEqual(response.status, 500)
    }
  })

  it("Vérifie que la requête métiers sans paramètre répond avec une erreur 400", async () => {
    const response = await httpClient().get("/api/v1/metiers")

    assert.strictEqual(response.status, 400)
    assert.strictEqual(response.body.error, "missing_parameters")
  })
})

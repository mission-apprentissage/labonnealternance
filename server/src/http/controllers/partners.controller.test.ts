import assert from "assert"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { describe, expect, it } from "vitest"

describe("partnersRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que l'on expose bien les id_parcoursup disponibles sur le catalogue", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/partners/parcoursup/formations" })

    expect(response.statusCode).toBe(200)
    assert.ok(JSON.parse(response.body).ids)
  })
})

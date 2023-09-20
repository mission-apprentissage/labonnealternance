import assert from "assert"
import { describe, it, expect } from "vitest"
import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

describe("partnersRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que l'on expose bien les id_parcoursup disponibles sur le catalogue", async () => {
    const response = await httpClient().get("/api/partners/parcoursup/formations")

    assert.strictEqual(response.status, 200)
    assert.ok(response.body.ids)
  })
})

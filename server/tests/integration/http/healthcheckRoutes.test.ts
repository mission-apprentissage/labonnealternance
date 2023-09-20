import assert from "assert"

import { describe, it, expect } from "vitest"

import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

describe("healthcheckRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que le server fonctionne", async () => {
    const response = await httpClient().get("/api")

    assert.strictEqual(response.status, 200)
    expect(response.body).toEqual({
      env: "local",
      healthcheck: {
        mongodb: true,
      },
    })
  })
})

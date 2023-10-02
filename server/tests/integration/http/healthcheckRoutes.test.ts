import { describe, it, expect } from "vitest"

import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

describe("healthcheckRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que le server fonctionne", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api" })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      env: "local",
      healthcheck: {
        mongodb: true,
      },
    })
  })
})

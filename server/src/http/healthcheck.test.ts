import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"
import { describe, expect, it } from "vitest"

import config from "../config"

describe("healthcheckRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que le server fonctionne", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api" })

    expect(response.statusCode).toBe(200)
    expect(JSON.parse(response.body)).toEqual({
      name: "La bonne alternance",
      version: config.version,
      env: "local",
      mongo: true,
    })
  })
})

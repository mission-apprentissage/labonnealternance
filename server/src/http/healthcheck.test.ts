import { describe, expect, it } from "vitest"

import { setupJobProcessor } from "@/jobs/jobs"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

import config from "../config"

describe("healthcheckRoutes", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que le server fonctionne", async () => {
    await setupJobProcessor()
    const response = await httpClient().inject({ method: "GET", path: "/api" })

    expect.soft(response.statusCode).toEqual(200)
    const json = JSON.parse(response.body)
    expect.soft(json).toMatchObject({
      commitHash: "hash-test",
      name: "La bonne alternance",
      version: config.version,
      env: "local",
      mongo: true,
    })
  })
})

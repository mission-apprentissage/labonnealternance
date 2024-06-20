import assert from "assert"

import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"
import isSemver from "is-semver"
import { describe, expect, it } from "vitest"

describe("version", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que la route répond", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/version" })

    expect(response.statusCode).toBe(200)
  })

  it("Vérifie que la route répond avec une version au format semver", async () => {
    const response = await httpClient().inject({ method: "GET", path: "/api/version" })

    assert(isSemver(JSON.parse(response.body).version))
  })
})

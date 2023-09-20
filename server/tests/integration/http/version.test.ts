import assert from "assert"
import isSemver from "is-semver"

import { describe, it, expect } from "vitest"
import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

describe("version", () => {
  useMongo()
  const httpClient = useServer()
  it("Vérifie que la route répond", async () => {
    const response = await httpClient().get("/api/version")

    assert.strictEqual(response.status, 200)
  })

  it("Vérifie que la route répond avec une version au format semver", async () => {
    const response = await httpClient().get("/api/version")

    assert(isSemver(response.body.version))
  })
})

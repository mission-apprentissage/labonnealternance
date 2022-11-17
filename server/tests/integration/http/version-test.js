import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import isSemver from "is-semver"

import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie que la route répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/version")

    assert.strictEqual(response.status, 200)
  })

  it("Vérifie que la route répond avec une version au format semver", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/version")

    assert(isSemver(response.data.version))
  })
})

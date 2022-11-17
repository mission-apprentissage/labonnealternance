import assert from "assert"
import httpTests from "../../utils/httpTests.js"

import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie que la route répond", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/updateRomesMetiers")

    assert.strictEqual(response.status, 200)
    assert.ok(response.data.error.indexOf("secret_missing") >= 0)
  })

  it("Vérifie que le service refuse un mauvais secret", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api/updateRomesMetiers?secret=123")

    assert.ok(response.data.error.indexOf("wrong_secret") >= 0)
  })
})

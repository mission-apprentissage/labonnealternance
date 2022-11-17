import assert from "assert"
import httpTests from "../../utils/httpTests.js"
import config from "../../../src/config.js"
import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("Vérifie que le server fonctionne", async () => {
    const { httpClient } = await startServer()

    const response = await httpClient.get("/api")

    assert.strictEqual(response.status, 200)
    assert.strictEqual(response.data.name, `Serveur express MNA - ${config.appName}`)
    assert.strictEqual(response.data.healthcheck.mongodb, true)
    assert.ok(response.data.env)
    assert.ok(response.data.version)
  })
})

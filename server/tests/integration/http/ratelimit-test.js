import assert from "assert"
import httpTests from "../../utils/httpTests.js"

import __filename from "../../../src/common/filename.js"

httpTests(__filename(import.meta.url), ({ startServer }) => {
  it("rate-limit, exemple avec /api/romelabels : 11 requêtes consécutives : les 10 premières sont acceptées, mais pas la 11ème", async () => {
    const { httpClient } = await startServer()

    const response1 = await httpClient.get("/api/romelabels")
    const response2 = await httpClient.get("/api/romelabels")
    const response3 = await httpClient.get("/api/romelabels")
    const response4 = await httpClient.get("/api/romelabels")
    const response5 = await httpClient.get("/api/romelabels")
    const response6 = await httpClient.get("/api/romelabels")
    const response7 = await httpClient.get("/api/romelabels")
    const response8 = await httpClient.get("/api/romelabels")
    const response9 = await httpClient.get("/api/romelabels")
    const response10 = await httpClient.get("/api/romelabels")
    const response11 = await httpClient.get("/api/romelabels")

    assert.strictEqual(response1.status, 200)
    assert.strictEqual(response2.status, 200)
    assert.strictEqual(response3.status, 200)
    assert.strictEqual(response4.status, 200)
    assert.strictEqual(response5.status, 200)
    assert.strictEqual(response6.status, 200)
    assert.strictEqual(response7.status, 200)
    assert.strictEqual(response8.status, 200)
    assert.strictEqual(response9.status, 200)
    assert.strictEqual(response10.status, 200)
    assert.strictEqual(response11.status, 429)
  })
})

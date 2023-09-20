import assert from "assert"

import { describe, it, beforeAll } from "vitest"
import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"
import { enableRateLimiter } from "@/http/utils/rateLimiters"

describe("ratelimit", () => {
  useMongo()
  const httpClient = useServer()

  beforeAll(() => {
    enableRateLimiter()
  })

  it("rate-limit, exemple avec /api/romelabels : 11 requêtes consécutives : les 10 premières sont acceptées, mais pas la 11ème", async () => {
    const response1 = await httpClient().get("/api/romelabels")
    const response2 = await httpClient().get("/api/romelabels")
    const response3 = await httpClient().get("/api/romelabels")
    const response4 = await httpClient().get("/api/romelabels")
    const response5 = await httpClient().get("/api/romelabels")
    const response6 = await httpClient().get("/api/romelabels")
    const response7 = await httpClient().get("/api/romelabels")
    const response8 = await httpClient().get("/api/romelabels")
    const response9 = await httpClient().get("/api/romelabels")
    const response10 = await httpClient().get("/api/romelabels")
    const response11 = await httpClient().get("/api/romelabels")

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

import assert from "assert"

import { describe, it, beforeAll } from "vitest"

import { enableRateLimiter } from "@/http/utils/rateLimiters"
import { useMongo } from "@tests/utils/mongo.utils"
import { useServer } from "@tests/utils/server.utils"

describe("ratelimit", () => {
  useMongo()
  const httpClient = useServer()

  beforeAll(() => {
    enableRateLimiter()
  })

  it("rate-limit, exemple avec /api/version : 6 requêtes consécutives : les 5 premières sont acceptées, mais pas la 6ème", async () => {
    const response1 = await httpClient().inject({ method: "GET", path: "/api/version", remoteAddress: "101.188.67.134" })
    const response2 = await httpClient().inject({ method: "GET", path: "/api/version", remoteAddress: "101.188.67.134" })
    const response3 = await httpClient().inject({ method: "GET", path: "/api/version", remoteAddress: "101.188.67.134" })
    const response4 = await httpClient().inject({ method: "GET", path: "/api/version", remoteAddress: "101.188.67.134" })

    assert.strictEqual(response1.statusCode, 200)
    assert.strictEqual(response2.statusCode, 200)
    assert.strictEqual(response3.statusCode, 200)
    assert.strictEqual(response4.statusCode, 429)
  })
})

import { randomBytes } from "node:crypto"
import { signSearchToken } from "shared/utils/search-token"
import { beforeEach, describe, expect, it, vi } from "vitest"

import config from "@/config"
import type { Server } from "@/http/server"

vi.mock("@/services/search/search.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/services/search/search.service")>()
  return { ...mod, suggestSearchTerms: vi.fn(async () => ({ suggestions: [] })) }
})

const { bindFastifyServer } = await import("@/http/server")

const UI_CONTAINER = "172.18.0.5"
// cf. rateLimit de /v1/search/suggest dans search.controller.ts
const SUGGEST_MAX_PER_SECOND = 60

const suggestViaBff = async (app: Server, clientIp: string, count: number) => {
  const headers = {
    "x-forwarded-for": clientIp,
    "x-lba-channel": "site",
    "x-lba-search-token": signSearchToken(config.searchTokenKeys, randomBytes(16).toString("hex"), new Date()),
  }
  const codes: number[] = []
  for (let i = 0; i < count; i++) {
    codes.push((await app.inject({ method: "GET", url: "/api/v1/search/suggest?q=boulanger", remoteAddress: UI_CONTAINER, headers })).statusCode)
  }
  return codes
}

describe("rate limit Fastify derrière le BFF", () => {
  let app: Server

  beforeEach(async () => {
    app = await bindFastifyServer()
  })

  it("limite l'internaute transmis, pas le conteneur UI qui relaie", async () => {
    const first = await suggestViaBff(app, "198.51.100.20", SUGGEST_MAX_PER_SECOND + 1)
    expect(first.at(-1)).toBe(429)
    expect(first.slice(0, SUGGEST_MAX_PER_SECOND)).toEqual(Array(SUGGEST_MAX_PER_SECOND).fill(200))

    expect(await suggestViaBff(app, "198.51.100.21", 1)).toEqual([200])
  })

  it("ne limite pas une IP privée transmise (BFF des previews, relayé par nginx)", async () => {
    expect(new Set(await suggestViaBff(app, "172.18.0.1", SUGGEST_MAX_PER_SECOND + 5))).toEqual(new Set([200]))
  })
})

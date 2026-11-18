import { beforeEach, describe, expect, it, vi } from "vitest"

import config from "@/config"
import type { Server } from "@/http/server"

vi.mock("@/services/search/search.service", async (importOriginal) => {
  const mod = await importOriginal<typeof import("@/services/search/search.service")>()
  return { ...mod, searchItems: vi.fn(async () => ({ hits: [], nbHits: 0, page: 0, nbPages: 0, degraded: false })) }
})

const { bindFastifyServer } = await import("@/http/server")

const RELAY_IPS = ["104.28.153.212", "104.28.157.169", "104.28.158.254", "104.28.161.245", "104.28.164.202", "104.28.164.203"]

const search = async (app: Server, remoteAddress: string, headers: Record<string, string> = {}) =>
  (await app.inject({ method: "GET", url: "/api/v1/search?q=communication", remoteAddress, headers })).statusCode

describe("quota partagé des relais sur /api/v1/search", () => {
  let app: Server

  beforeEach(async () => {
    app = await bindFastifyServer()
  })

  it("plafonne l'ensemble des IP du relais hors site, quelle que soit l'IP", async () => {
    const codes: number[] = []
    for (const ip of RELAY_IPS) {
      codes.push(await search(app, ip, { "user-agent": "curl/8.14.1" }))
    }
    expect(codes).toEqual([200, 200, 200, 200, 200, 429])
  })

  it("ne compte pas un domaine qui commence comme le site", async () => {
    const codes: number[] = []
    for (const ip of RELAY_IPS) {
      codes.push(await search(app, ip, { referer: `${config.publicUrl}.exemple.net/recherche` }))
    }
    expect(codes.at(-1)).toBe(429)
  })

  it("laisse passer un visiteur du relais arrivé par le site (referer)", async () => {
    for (const ip of RELAY_IPS) await search(app, ip)
    const codes: number[] = []
    for (let i = 0; i < 10; i++) {
      codes.push(await search(app, RELAY_IPS[0], { referer: `${config.publicUrl}/recherche?q=communication` }))
    }
    expect(codes).toEqual(Array(10).fill(200))
  })

  it("laisse passer un visiteur du relais arrivé par le site (Sec-Fetch-Site)", async () => {
    for (const ip of RELAY_IPS) await search(app, ip)
    expect(await search(app, RELAY_IPS[1], { "sec-fetch-site": "same-origin" })).toBe(200)
  })

  it("garde la limite par IP hors relais, même quota relais épuisé", async () => {
    for (const ip of RELAY_IPS) await search(app, ip)
    const codes: number[] = []
    for (let i = 0; i < 10; i++) codes.push(await search(app, "198.51.100.20"))
    expect(codes).toEqual(Array(10).fill(200))
  })

  it("traite une IP voisine de la plage comme une IP ordinaire", async () => {
    const codes: number[] = []
    for (let i = 0; i < 6; i++) codes.push(await search(app, `104.29.0.${i + 1}`))
    expect(codes).toEqual(Array(6).fill(200))
  })
})

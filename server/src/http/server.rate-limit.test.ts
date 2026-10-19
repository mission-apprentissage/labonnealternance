import { beforeAll, describe, expect, it, vi } from "vitest"

import type { Server } from "./server"

const API_APPRENTISSAGE_IP = "203.0.113.50"

vi.mock("@/config", async (importOriginal) => {
  const mod = await importOriginal<{ default: { apiApprentissage: Record<string, unknown> } }>()
  return { default: { ...mod.default, apiApprentissage: { ...mod.default.apiApprentissage, serverIps: [API_APPRENTISSAGE_IP] } } }
})

const { bindFastifyServer } = await import("./server")

// /api/version : 3 requêtes par seconde et par IP, sans dépendance à la base.
const callVersion = async (app: Server, remoteAddress: string, count: number) => {
  const codes: number[] = []
  for (let i = 0; i < count; i++) {
    codes.push((await app.inject({ method: "GET", url: "/api/version", remoteAddress })).statusCode)
  }
  return codes
}

describe("allowList du rate limit Fastify", () => {
  let app: Server

  beforeAll(async () => {
    app = await bindFastifyServer()
  })

  it("limite une IP publique", async () => {
    expect(await callVersion(app, "198.51.100.20", 5)).toEqual([200, 200, 200, 429, 429])
  })

  it("ne limite pas les serveurs api-apprentissage de config.apiApprentissage.serverIps", async () => {
    expect(await callVersion(app, API_APPRENTISSAGE_IP, 10)).toEqual(Array(10).fill(200))
  })

  it("ne limite pas une IP privée", async () => {
    expect(await callVersion(app, "172.18.0.1", 10)).toEqual(Array(10).fill(200))
  })
})

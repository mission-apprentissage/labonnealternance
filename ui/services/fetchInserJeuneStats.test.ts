import { afterEach, describe, expect, it, vi } from "vitest"
import fetchInserJeunesStats from "./fetchInserJeuneStats"

vi.mock("@/config.public", () => ({
  publicConfig: { apiEndpoint: "https://api.test" },
}))

const stubFetch = (status: number, body: unknown = {}) => {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: status >= 200 && status < 300,
      status,
      json: () => Promise.resolve(body),
    })
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

const training = {
  place: { zipCode: "75001" },
  training: { cfd: "12345678" },
} as any

describe("fetchInserJeunesStats", () => {
  it("retourne null si training est falsy", async () => {
    expect(await fetchInserJeunesStats(null as any)).toBeNull()
    expect(await fetchInserJeunesStats(undefined as any)).toBeNull()
  })

  it("retourne les données si l'API répond 200", async () => {
    const data = { taux_insertion: 75 }
    stubFetch(200, data)
    expect(await fetchInserJeunesStats(training)).toEqual(data)
  })

  it("retourne null si l'API répond 404", async () => {
    stubFetch(404)
    expect(await fetchInserJeunesStats(training)).toBeNull()
  })

  it("retourne null si l'API répond 500", async () => {
    stubFetch(500)
    expect(await fetchInserJeunesStats(training)).toBeNull()
  })

  it("retourne null si l'API répond 503", async () => {
    stubFetch(503)
    expect(await fetchInserJeunesStats(training)).toBeNull()
  })

  it("retourne null en cas d'erreur réseau", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("Network error")))
    expect(await fetchInserJeunesStats(training)).toBeNull()
  })
})

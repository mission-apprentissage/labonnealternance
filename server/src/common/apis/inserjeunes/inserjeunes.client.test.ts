import nock from "nock"
import { beforeEach, describe, expect, it } from "vitest"

import { _resetForTesting, fetchInserJeunesStats } from "./inserjeunes.client"
import { inserJeunesStatsFixture, omogenAuthTokenFixture } from "./inserjeunes.client.fixture"

const OMOGEN_BASE_URL = "https://omogen-api-pr.phm.education.gouv.fr"
const STATS_PATH = "/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75001/certifications/12345678"

describe("InserJeunes Client", () => {
  beforeEach(() => {
    nock.cleanAll()
    _resetForTesting()
  })

  describe("fetchInserJeunesStats", () => {
    it("should fetch InserJeunes stats with valid token", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)

      nock(OMOGEN_BASE_URL).get(STATS_PATH).matchHeader("authorization", `Bearer ${omogenAuthTokenFixture.access_token}`).reply(200, inserJeunesStatsFixture)

      const result = await fetchInserJeunesStats("75001", "12345678")

      expect(result).toEqual(inserJeunesStatsFixture)
    })

    it("should return null for 404 responses", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)

      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/99999/certifications/00000000").reply(404)

      const result = await fetchInserJeunesStats("99999", "00000000")

      expect(result).toBeNull()
    })

    it("should return null on auth failure", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(401, { error: "invalid_client" })

      const result = await fetchInserJeunesStats("75001", "12345678")

      expect(result).toBeNull()
    })

    it("should return null during cooldown without retrying token requests", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(401, { error: "invalid_client" })
      await fetchInserJeunesStats("75001", "12345678")

      // During cooldown: no token request should be made
      const result = await fetchInserJeunesStats("75001", "12345678")
      expect(result).toBeNull()
      expect(nock.pendingMocks()).toHaveLength(0)
    })

    it("should not activate cooldown on transient network errors", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").replyWithError({ code: "ECONNRESET", message: "socket hang up" })
      await fetchInserJeunesStats("75001", "12345678")

      // Next call should retry token fetch (no cooldown)
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)
      nock(OMOGEN_BASE_URL).get(STATS_PATH).reply(200, inserJeunesStatsFixture)

      const result = await fetchInserJeunesStats("75001", "12345678")
      expect(result).toEqual(inserJeunesStatsFixture)
    }, 15_000)

    it("should throw internal error on 500 API errors", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)

      nock(OMOGEN_BASE_URL).get(STATS_PATH).reply(500, { error: "Internal error" })

      await expect(fetchInserJeunesStats("75001", "12345678")).rejects.toThrow()
    })

    it("should return null for 502 and 503 (API temporarily unavailable)", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)
      nock(OMOGEN_BASE_URL).get(STATS_PATH).reply(502, { error: "Bad Gateway" })
      expect(await fetchInserJeunesStats("75001", "12345678")).toBeNull()

      nock(OMOGEN_BASE_URL).get(STATS_PATH).reply(503, { error: "Service Unavailable" })
      expect(await fetchInserJeunesStats("75001", "12345678")).toBeNull()
    })

    it("should retry on ECONNRESET and succeed on second attempt", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)

      nock(OMOGEN_BASE_URL).get(STATS_PATH).replyWithError({ code: "ECONNRESET", message: "socket hang up" })
      nock(OMOGEN_BASE_URL).get(STATS_PATH).reply(200, inserJeunesStatsFixture)

      const result = await fetchInserJeunesStats("75001", "12345678")
      expect(result).toEqual(inserJeunesStatsFixture)
    }, 10_000)

    it("should throw after max retries on persistent transient error", async () => {
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)

      for (let i = 0; i < 3; i++) {
        nock(OMOGEN_BASE_URL).get(STATS_PATH).replyWithError({ code: "ECONNRESET", message: "socket hang up" })
      }

      await expect(fetchInserJeunesStats("75001", "12345678")).rejects.toThrow("Erreur lors de la récupération des données InserJeunes")
    }, 30_000)
  })
})

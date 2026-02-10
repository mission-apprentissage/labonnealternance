import nock from "nock"
import { beforeEach, describe, expect, it } from "vitest"

import { fetchInserJeunesStats } from "./inserjeunes.client"
import { inserJeunesStatsFixture, omogenAuthTokenFixture } from "./inserjeunes.client.fixture"

const OMOGEN_BASE_URL = "https://omogen-api-pr.phm.education.gouv.fr"

describe("InserJeunes Client", () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe("fetchInserJeunesStats", () => {
    it("should fetch InserJeunes stats with valid token", async () => {
      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)

      // Mock stats request
      nock(OMOGEN_BASE_URL)
        .get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75001/certifications/12345678")
        .matchHeader("authorization", `Bearer ${omogenAuthTokenFixture.access_token}`)
        .reply(200, inserJeunesStatsFixture)

      const result = await fetchInserJeunesStats("75001", "12345678")

      expect(result).toEqual(inserJeunesStatsFixture)
    })

    it("should return null for 404 responses", async () => {
      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)

      // Mock 404 response
      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/99999/certifications/00000000").reply(404)

      const result = await fetchInserJeunesStats("99999", "00000000")

      expect(result).toBeNull()
    })

    it("should throw internal error on auth failure", async () => {
      // Mock failed token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(401, { error: "invalid_client" })

      await expect(fetchInserJeunesStats("75001", "12345678")).rejects.toThrow()
    })

    it("should throw internal error on non-404 API errors", async () => {
      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, omogenAuthTokenFixture)

      // Mock 500 error
      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75001/certifications/12345678").reply(500, { error: "Internal error" })

      await expect(fetchInserJeunesStats("75001", "12345678")).rejects.toThrow()
    })
  })
})

import nock from "nock"
import { beforeEach, describe, expect, it } from "vitest"

import { fetchInserJeuneStats } from "./inserjeune.client"

const OMOGEN_BASE_URL = "https://omogen-api-pr.phm.education.gouv.fr"

describe("InserJeune Client", () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe("fetchInserJeuneStats", () => {
    it("should fetch InserJeune stats with valid token", async () => {
      const mockToken = "mock-access-token"
      const mockStats = {
        millesime: "2023",
        taux_emploi_6_mois: 75,
        taux_poursuite_etudes: 20,
      }

      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, {
        access_token: mockToken,
        expires_in: 3600,
        token_type: "Bearer",
      })

      // Mock stats request
      nock(OMOGEN_BASE_URL)
        .get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75001/certifications/12345678")
        .matchHeader("authorization", `Bearer ${mockToken}`)
        .reply(200, mockStats)

      const result = await fetchInserJeuneStats("75001", "12345678")

      expect(result).toEqual(mockStats)
    })

    it("should return null for 404 responses", async () => {
      const mockToken = "mock-access-token"

      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, {
        access_token: mockToken,
        expires_in: 3600,
        token_type: "Bearer",
      })

      // Mock 404 response
      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/99999/certifications/00000000").reply(404)

      const result = await fetchInserJeuneStats("99999", "00000000")

      expect(result).toBeNull()
    })

    it("should throw internal error on auth failure", async () => {
      // Mock failed token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(401, { error: "invalid_client" })

      await expect(fetchInserJeuneStats("75001", "12345678")).rejects.toThrow()
    })

    it("should throw internal error on non-404 API errors", async () => {
      const mockToken = "mock-access-token"

      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, {
        access_token: mockToken,
        expires_in: 3600,
        token_type: "Bearer",
      })

      // Mock 500 error
      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75001/certifications/12345678").reply(500, { error: "Internal error" })

      await expect(fetchInserJeuneStats("75001", "12345678")).rejects.toThrow()
    })
  })
})

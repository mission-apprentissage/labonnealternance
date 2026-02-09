import nock from "nock"
import { describe, expect, it, beforeEach } from "vitest"

import { useMongo } from "@tests/utils/mongo.test.utils"
import { useServer } from "@tests/utils/server.test.utils"

const OMOGEN_BASE_URL = "https://omogen-api-pr.phm.education.gouv.fr"

useMongo()

describe("InserJeune Controller", () => {
  const httpClient = useServer()

  beforeEach(() => {
    nock.cleanAll()
  })

  describe("GET /inserjeune/:zipcode/:cfd", () => {
    it("should return InserJeune stats for valid zipcode and cfd", async () => {
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
      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75001/certifications/12345678").reply(200, mockStats)

      const response = await httpClient().inject({
        method: "GET",
        path: "/api/inserjeune/75001/12345678",
      })

      expect(response.statusCode).toBe(200)
      expect(response.json()).toEqual(mockStats)
    })

    it("should return 404 when no data is available", async () => {
      const mockToken = "mock-access-token"

      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, {
        access_token: mockToken,
        expires_in: 3600,
        token_type: "Bearer",
      })

      // Mock 404 response
      nock(OMOGEN_BASE_URL).get("/exposition-inserjeunes-insersup/api/inserjeunes/regionales/99999/certifications/00000000").reply(404)

      const response = await httpClient().inject({
        method: "GET",
        path: "/api/inserjeune/99999/00000000",
      })

      expect(response.statusCode).toBe(404)
      expect(response.json()).toEqual({ error: "Pas de données disponibles" })
    })

    it("should handle rate limiting", async () => {
      // Mock token request
      nock(OMOGEN_BASE_URL).post("/auth/token").reply(200, {
        access_token: "mock-token",
        expires_in: 3600,
        token_type: "Bearer",
      })

      // Mock multiple stats requests (test rate limit of 50 req/s)
      for (let i = 0; i < 55; i++) {
        nock(OMOGEN_BASE_URL).get(`/exposition-inserjeunes-insersup/api/inserjeunes/regionales/75001/certifications/1234567${i}`).reply(200, { millesime: "2023" })
      }

      // Make 50 requests (within rate limit)
      for (let i = 0; i < 50; i++) {
        const response = await httpClient().inject({
          method: "GET",
          path: `/api/inserjeune/75001/1234567${i}`,
        })
        expect(response.statusCode).toBe(200)
      }

      // 51st request should be rate limited
      const rateLimitedResponse = await httpClient().inject({
        method: "GET",
        path: "/api/inserjeune/75001/12345670",
      })
      expect(rateLimitedResponse.statusCode).toBe(429)
    })
  })
})

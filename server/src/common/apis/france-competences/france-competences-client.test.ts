import nock from "nock"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { beforeEach, describe, expect, it } from "vitest"

import config from "@/config"

import { FCGetOpcoInfos, FCOpcoToOpcoEnum } from "./france-competences-client"
import { generateFCOpcoResponseFixture, nockFranceCompetencesOpcoSearch } from "./france-competences-client.fixture"

describe("france-competences-client", () => {
  beforeEach(() => {
    nock.cleanAll()
  })

  describe("FCOpcoToOpcoEnum", () => {
    it("should convert fc opco names to opco enum", () => {
      expect(FCOpcoToOpcoEnum("CONSTRUCTYS")).toBe(OPCOS_LABEL.CONSTRUCTYS)
      expect(FCOpcoToOpcoEnum("L'OPCOMMERCE")).toBe(OPCOS_LABEL.OPCOMMERCE)
      expect(FCOpcoToOpcoEnum("AKTO")).toBe(OPCOS_LABEL.AKTO)
      expect(FCOpcoToOpcoEnum("OPCO EP")).toBe(OPCOS_LABEL.EP)
      expect(FCOpcoToOpcoEnum("UNIFORMATION COHESION SOCIALE")).toBe(OPCOS_LABEL.UNIFORMATION)
      expect(FCOpcoToOpcoEnum("N/C")).toBeNull()
    })
  })

  describe("FCGetOpcoInfos", () => {
    it("should return OPCO and IDCC for a valid SIRET", async () => {
      const validSiret = "42476141900045"
      const response = generateFCOpcoResponseFixture({
        siret: validSiret,
        idcc: "1486",
        opcoRattachement: {
          code: "1",
          nom: "AKTO",
        },
      })

      nockFranceCompetencesOpcoSearch(validSiret, response)

      const result = await FCGetOpcoInfos(validSiret)

      expect(result).toEqual({ opco: OPCOS_LABEL.AKTO, idcc: 1486 })
      expect(nock.isDone()).toBe(true)
    })

    it("should parse an IDCC with leading zeros", async () => {
      const siret = "42476141900045"
      nockFranceCompetencesOpcoSearch(siret, generateFCOpcoResponseFixture({ siret, idcc: "0016" }))

      expect(await FCGetOpcoInfos(siret)).toEqual({ opco: OPCOS_LABEL.AKTO, idcc: 16 })
    })

    it("should return the OPCO with a null IDCC when idcc is absent", async () => {
      const siret = "42476141900045"
      const { idcc: _idcc, ...response } = generateFCOpcoResponseFixture({ siret })
      nockFranceCompetencesOpcoSearch(siret, response)

      expect(await FCGetOpcoInfos(siret)).toEqual({ opco: OPCOS_LABEL.AKTO, idcc: null })
      expect(nock.isDone()).toBe(true)
    })

    it("should return the OPCO with a null IDCC when idcc is empty", async () => {
      const siret = "42476141900045"
      nockFranceCompetencesOpcoSearch(siret, generateFCOpcoResponseFixture({ siret, idcc: "" }))

      expect(await FCGetOpcoInfos(siret)).toEqual({ opco: OPCOS_LABEL.AKTO, idcc: null })
      expect(nock.isDone()).toBe(true)
    })

    it("should return null for an invalid SIRET", async () => {
      const invalidSiret = "424761419000455"
      const response = {
        code: "99" as const,
        siret: invalidSiret,
      }

      nockFranceCompetencesOpcoSearch(invalidSiret, response)

      const result = await FCGetOpcoInfos(invalidSiret)

      expect(result).toBeNull()
      expect(nock.isDone()).toBe(true)
    })

    it("should return null for code 03 (API Déclaration)", async () => {
      const siret = "12345678901234"
      const response = {
        code: "03" as const,
        siret,
        idcc: "1234",
        opcoRattachement: {
          code: "1",
          nom: "AKTO",
        },
      }

      nockFranceCompetencesOpcoSearch(siret, response)

      const result = await FCGetOpcoInfos(siret)

      expect(result).toBeNull()
      expect(nock.isDone()).toBe(true)
    })

    it("should return null on 429 (rate limit)", async () => {
      const siret = "42476141900045"
      nock(config.franceCompetences.baseUrl)
        .get(`/siro/v1/public/${encodeURIComponent(siret)}`)
        .reply(429, { message: "Too Many Requests" })

      const result = await FCGetOpcoInfos(siret)
      expect(result).toBeNull()
    })

    it("should return null for opco label N/C", async () => {
      const siret = "12345678901234"
      const response = {
        code: "01" as const,
        siret,
        idcc: "1234",
        opcoRattachement: {
          code: "N/C",
          nom: "N/C",
        },
      }

      nockFranceCompetencesOpcoSearch(siret, response)

      const result = await FCGetOpcoInfos(siret)

      expect(result).toBeNull()
      expect(nock.isDone()).toBe(true)
    })
  })
})

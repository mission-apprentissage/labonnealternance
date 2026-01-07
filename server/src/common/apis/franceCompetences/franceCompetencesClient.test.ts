import nock from "nock"
import { OPCOS_LABEL } from "shared/constants/recruteur"
import { describe, expect, it } from "vitest"

import { FCGetOpcoInfos, FCOpcoToOpcoEnum } from "./franceCompetencesClient"
import { generateFCOpcoResponseFixture, nockFranceCompetencesOpcoSearch } from "./franceCompetencesClient.fixture"

describe("franceCompetencesClient", () => {
  describe("FCOpcoToOpcoEnum", () => {
    it("should convert fc opco names to opco enum", () => {
      expect(FCOpcoToOpcoEnum("CONSTRUCTYS")).toBe(OPCOS_LABEL.CONSTRUCTYS)
      expect(FCOpcoToOpcoEnum("L'OPCOMMERCE")).toBe(OPCOS_LABEL.OPCOMMERCE)
      expect(FCOpcoToOpcoEnum("AKTO")).toBe(OPCOS_LABEL.AKTO)
      expect(FCOpcoToOpcoEnum("OPCO EP")).toBe(OPCOS_LABEL.EP)
      expect(FCOpcoToOpcoEnum("UNIFORMATION COHESION SOCIALE")).toBe(OPCOS_LABEL.UNIFORMATION)
    })
  })

  describe("FCGetOpcoInfos", () => {
    it("should return OPCO info for a valid SIRET", async () => {
      const validSiret = "42476141900045"
      const response = generateFCOpcoResponseFixture({
        siret: validSiret,
        opcoRattachement: {
          code: "1",
          nom: "AKTO",
        },
      })

      nockFranceCompetencesOpcoSearch(validSiret, response)

      const result = await FCGetOpcoInfos(validSiret)

      expect(result).toBe(OPCOS_LABEL.AKTO)
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
  })
})

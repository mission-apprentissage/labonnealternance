import { OPCOS } from "shared/constants/recruteur"
import { describe, expect, it } from "vitest"

import { FCOpcoToOpcoEnum } from "./franceCompetencesClient"

describe("franceCompetencesClient", () => {
  describe("FCOpcoToOpcoEnum", () => {
    it("should convert fc opco names to opco enum", () => {
      expect(FCOpcoToOpcoEnum("CONSTRUCTYS")).toBe(OPCOS.CONSTRUCTYS)
      expect(FCOpcoToOpcoEnum("L'OPCOMMERCE")).toBe(OPCOS.OPCOMMERCE)
      expect(FCOpcoToOpcoEnum("AKTO")).toBe(OPCOS.AKTO)
      expect(FCOpcoToOpcoEnum("OPCO EP")).toBe(OPCOS.EP)
      expect(FCOpcoToOpcoEnum("UNIFORMATION COHESION SOCIALE")).toBe(OPCOS.UNIFORMATION)
    })
  })
})

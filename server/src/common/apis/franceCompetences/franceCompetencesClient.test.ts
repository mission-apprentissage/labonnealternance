import { OPCOS_LABEL } from "shared/constants/recruteur"
import { describe, expect, it } from "vitest"

import { FCOpcoToOpcoEnum } from "./franceCompetencesClient"

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
})

import { describe, expect, it } from "vitest"

import { OPCOS_LABEL } from "../constants/recruteur.js"
import { getOpcoFilterLabel, parseOpcoFilter } from "./opco-search-filter.js"

describe("parseOpcoFilter", () => {
  it.each([
    ["valeur absente", undefined],
    ["chaîne vide", ""],
    ["libellé long", OPCOS_LABEL.SANTE],
    ["opco inconnu", "UNKNOWN_OPCO"],
    ["opco multiple", "MULTIPLE_OPCO"],
    ["clé inexistante", "OPCO3"],
  ])("rejette %s", (_, value) => {
    expect(parseOpcoFilter(value)).toBeNull()
  })

  it("accepte la clé courte quelle que soit la casse", () => {
    expect(parseOpcoFilter("akto")).toBe("AKTO")
    expect(parseOpcoFilter(" Ep ")).toBe("EP")
  })

  it("traduit la clé en libellé de jobs_partners", () => {
    expect(getOpcoFilterLabel("EP")).toBe(OPCOS_LABEL.EP)
  })
})

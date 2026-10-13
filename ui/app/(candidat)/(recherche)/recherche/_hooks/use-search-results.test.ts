import { describe, expect, it } from "vitest"

import { paramsToQuerystring } from "./use-search-results"

describe("paramsToQuerystring", () => {
  it("transmet l'OPCO à /v1/search", () => {
    expect(paramsToQuerystring({ mode: "emplois", radius: 20, page: 0, hitsPerPage: 20, opco: "AKTO" })).toMatchObject({ opco: "AKTO" })
  })

  it("n'envoie pas de paramètre opco sans filtre", () => {
    expect(paramsToQuerystring({ mode: "emplois", radius: 20, page: 0, hitsPerPage: 20 })).not.toHaveProperty("opco")
  })
})

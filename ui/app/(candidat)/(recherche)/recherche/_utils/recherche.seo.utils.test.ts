import { describe, expect, it } from "vitest"

import { buildJobsMinQuerystring } from "./recherche.seo.utils"

describe("buildJobsMinQuerystring", () => {
  it("sérialise les romes", () => {
    expect(buildJobsMinQuerystring({ romes: ["M1805", "M1806"], geo: null, radius: 30 } as any)).toEqual({ romes: "M1805,M1806" })
  })

  it("ajoute la géo quand présente", () => {
    expect(buildJobsMinQuerystring({ romes: ["M1805"], geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 }, radius: 30 } as any)).toEqual({
      romes: "M1805",
      latitude: 45.75,
      longitude: 4.85,
      radius: 30,
    })
  })

  it("ajoute diploma / opco / rncp / handicap quand présents", () => {
    expect(buildJobsMinQuerystring({ romes: ["M1805"], geo: null, radius: 30, diploma: "3", opco: "AKTO", rncp: "RNCP123", elligibleHandicapFilter: true } as any)).toEqual({
      romes: "M1805",
      diploma: "3",
      opco: "AKTO",
      rncp: "RNCP123",
      elligibleHandicapFilter: "true",
    })
  })

  it("retourne un objet vide pour des params null", () => {
    expect(buildJobsMinQuerystring(null)).toEqual({})
  })
})

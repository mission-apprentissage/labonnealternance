import { describe, expect, it } from "vitest"

import { buildJobsMinQuerystring, buildRechercheH1 } from "./recherche.seo.utils"

describe("buildRechercheH1", () => {
  it("compose métier + ville", () => {
    expect(buildRechercheH1({ job_name: "Data analyst", geo: { address: "Lyon", latitude: 45.75, longitude: 4.85 } })).toBe("Alternance Data analyst à Lyon")
  })

  it("gère le métier seul (sans géo)", () => {
    expect(buildRechercheH1({ job_name: "Data analyst", geo: null })).toBe("Alternance Data analyst")
  })

  it("ignore une géo sans libellé d'adresse", () => {
    expect(buildRechercheH1({ job_name: "Data analyst", geo: { address: null, latitude: 45.75, longitude: 4.85 } })).toBe("Alternance Data analyst")
  })

  it("retourne null sans métier", () => {
    expect(buildRechercheH1({ job_name: null, geo: null })).toBeNull()
  })

  it("traite un métier vide comme une absence", () => {
    expect(buildRechercheH1({ job_name: "  ", geo: null })).toBeNull()
  })

  it("gère des params null", () => {
    expect(buildRechercheH1(null)).toBeNull()
  })
})

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

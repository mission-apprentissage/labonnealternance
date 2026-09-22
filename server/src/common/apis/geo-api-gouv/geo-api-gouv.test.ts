import nock from "nock"
import { afterEach, describe, expect, it } from "vitest"

import { getCommuneParCodeDepartement, getCommuneParCodeInsee, getDepartements } from "./geo-api-gouv"

// Réponses de https://geo.api.gouv.fr rejouées par nock : l'API réelle dépasse parfois le timeout
// de 5 s depuis les runners GitHub.
const GEO_API_URL = "https://geo.api.gouv.fr"
const COMMUNE_FIELDS = { fields: "code,codeParent,codesPostaux,centre,bbox,codeDepartement,codeRegion", geometry: "centre" }

const paris = {
  centre: {
    coordinates: [2.347, 48.8589],
    type: "Point",
  },
  bbox: {
    coordinates: [
      [
        [2.224219, 48.815562],
        [2.469851, 48.815562],
        [2.469851, 48.902148],
        [2.224219, 48.902148],
        [2.224219, 48.815562],
      ],
    ],
    type: "Polygon",
  },
  code: "75056",
  codeDepartement: "75",
  codeRegion: "11",
  codesPostaux: [
    "75001",
    "75002",
    "75003",
    "75004",
    "75005",
    "75006",
    "75007",
    "75008",
    "75009",
    "75010",
    "75011",
    "75012",
    "75013",
    "75014",
    "75015",
    "75016",
    "75017",
    "75018",
    "75019",
    "75020",
    "75116",
  ],
  nom: "Paris",
}

const departements = [
  { code: "75", codeRegion: "11", nom: "Paris" },
  { code: "76", codeRegion: "28", nom: "Seine-Maritime" },
  { code: "77", codeRegion: "11", nom: "Seine-et-Marne" },
  { code: "78", codeRegion: "11", nom: "Yvelines" },
  { code: "79", codeRegion: "75", nom: "Deux-Sèvres" },
]

afterEach(() => {
  nock.cleanAll()
})

describe("getCommuneParCodeInsee", () => {
  it("should return a city by its insee code", async () => {
    nock(GEO_API_URL).get(`/communes/${paris.code}`).query(COMMUNE_FIELDS).reply(200, paris)

    await expect(getCommuneParCodeInsee(paris.code)).resolves.toEqual(paris)
    expect(nock.isDone()).toBe(true)
  })

  it("should throw an internal error when the API fails", async () => {
    nock(GEO_API_URL).get(`/communes/${paris.code}`).query(COMMUNE_FIELDS).reply(500)

    await expect(getCommuneParCodeInsee(paris.code)).rejects.toThrow("Error while fetching commune by insee code")
    expect(nock.isDone()).toBe(true)
  })
})

describe("getDepartements", () => {
  it("should return the list of departments", async () => {
    nock(GEO_API_URL).get("/departements").query({ fields: "nom,code,codeRegion" }).reply(200, departements)

    await expect(getDepartements()).resolves.toEqual(departements)
    expect(nock.isDone()).toBe(true)
  })
})

describe("getCommuneParCodeDepartement", () => {
  it("should return the list of cities in a department", async () => {
    nock(GEO_API_URL).get(`/departements/${paris.codeDepartement}/communes`).query(COMMUNE_FIELDS).reply(200, [paris])

    await expect(getCommuneParCodeDepartement(paris.codeDepartement)).resolves.toEqual([paris])
    expect(nock.isDone()).toBe(true)
  })
})

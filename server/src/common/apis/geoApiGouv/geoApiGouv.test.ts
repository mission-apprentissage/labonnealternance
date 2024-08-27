import { describe, expect, it } from "vitest"

import { getCommuneParCodeDepartement, getCommuneParCodeInsee, getDepartements } from "./geoApiGouv"

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

describe("getCommuneParCodeInsee", () => {
  it("should return a city by its insee code", async () => {
    // TODO: mock fetch

    const result = await getCommuneParCodeInsee(paris.code)

    expect(result).toEqual(paris)
  })
})

describe("getDepartements", () => {
  it.skip("should return the list of departments", async () => {
    const departements = [
      {
        code: "75",
        codeRegion: "11",
        nom: "Paris",
      },
      {
        code: "76",
        codeRegion: "28",
        nom: "Seine-Maritime",
      },
      {
        code: "77",
        codeRegion: "11",
        nom: "Seine-et-Marne",
      },
      {
        code: "78",
        codeRegion: "11",
        nom: "Yvelines",
      },
      {
        code: "79",
        codeRegion: "75",
        nom: "Deux-Sèvres",
      },
    ]
    const result = await getDepartements()

    expect(result).toEqual(departements)
  })
})

describe("getCommuneParCodeDepartement", () => {
  it("should return the list of cities in a department", async () => {
    const communes = [paris]
    const result = await getCommuneParCodeDepartement(paris.codeDepartement)
    expect(result).toEqual(communes)
  })
})

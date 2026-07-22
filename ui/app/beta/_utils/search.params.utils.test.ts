import { describe, expect, it } from "vitest"

import type { ISearchPageParams } from "./search.params.utils"
import { buildSearchPageTitle } from "./search.params.utils"

const base: ISearchPageParams = { mode: "emplois", radius: 20, page: 0, hitsPerPage: 20 }

describe("buildSearchPageTitle", () => {
  it("sans métier : titre de base seul, quel que soit le lieu", () => {
    expect(buildSearchPageTitle(base)).toBe("Offres en alternance | La bonne alternance")
    expect(buildSearchPageTitle({ ...base, lieu_label: "Paris 75001", latitude: 48.86, longitude: 2.35 })).toBe("Offres en alternance | La bonne alternance")
  })

  it("métier + lieu : « - {métier} à {lieu} »", () => {
    expect(buildSearchPageTitle({ ...base, q: "boulanger", lieu_label: "Paris 75001", latitude: 48.86, longitude: 2.35 })).toBe(
      "Offres en alternance - boulanger à Paris 75001 | La bonne alternance"
    )
  })

  it("métier sans géo : « sur la France entière »", () => {
    expect(buildSearchPageTitle({ ...base, q: "boulanger" })).toBe("Offres en alternance - boulanger sur la France entière | La bonne alternance")
  })

  it("métier + géo sans label de lieu : pas de mention de lieu (comportement legacy)", () => {
    expect(buildSearchPageTitle({ ...base, q: "boulanger", latitude: 48.86, longitude: 2.35 })).toBe("Offres en alternance - boulanger | La bonne alternance")
  })

  it("mode formations : base « Formations en alternance »", () => {
    expect(buildSearchPageTitle({ ...base, mode: "formations", q: "cuisine", lieu_label: "Lyon" })).toBe("Formations en alternance - cuisine à Lyon | La bonne alternance")
  })

  it("mode emplois_formation : base « Offres en alternance » (offres CFA/GEIQ)", () => {
    expect(buildSearchPageTitle({ ...base, mode: "emplois_formation" })).toBe("Offres en alternance | La bonne alternance")
  })
})

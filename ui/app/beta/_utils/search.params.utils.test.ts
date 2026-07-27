import { describe, expect, it } from "vitest"

import type { ISearchPageParams } from "./search.params.utils"
import { buildSearchPageTitle, buildSearchUrl, parseSearchPageParams } from "./search.params.utils"

const base: ISearchPageParams = { mode: "emplois", radius: 20, page: 0, hitsPerPage: 20 }

describe("is_algo_company multi-valeurs (type d'offres d'emploi)", () => {
  it("parse un param répété en tableau, dédupliqué, valeurs invalides ignorées", () => {
    expect(parseSearchPageParams(new URLSearchParams("is_algo_company=false")).is_algo_company).toEqual([false])
    expect(parseSearchPageParams(new URLSearchParams("is_algo_company=false&is_algo_company=true")).is_algo_company).toEqual([false, true])
    expect(parseSearchPageParams(new URLSearchParams("is_algo_company=true&is_algo_company=true")).is_algo_company).toEqual([true])
    expect(parseSearchPageParams(new URLSearchParams("is_algo_company=oui")).is_algo_company).toBeUndefined()
    expect(parseSearchPageParams(new URLSearchParams("")).is_algo_company).toBeUndefined()
  })

  it("round-trip URL : les deux cases cochées persistent dans l'URL", () => {
    const url = buildSearchUrl({ ...base, is_algo_company: [false, true] })
    expect(url).toBe("/beta/recherche?is_algo_company=false&is_algo_company=true")
    expect(parseSearchPageParams(new URL(url, "https://x").searchParams).is_algo_company).toEqual([false, true])
  })
})

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

describe("parsing numérique gardé (URL malformée)", () => {
  it("coordonnées non numériques → undefined (pas de NaN propagé)", () => {
    const params = parseSearchPageParams(new URLSearchParams("latitude=abc&longitude=def"))
    expect(params.latitude).toBeUndefined()
    expect(params.longitude).toBeUndefined()
  })

  it("une coordonnée invalide invalide la paire (hasGeo exige les deux)", () => {
    const params = parseSearchPageParams(new URLSearchParams("latitude=48.86&longitude=xyz"))
    expect(params.latitude).toBeUndefined()
    expect(params.longitude).toBeUndefined()
  })

  it("radius/page/hitsPerPage malformés → valeurs par défaut", () => {
    const params = parseSearchPageParams(new URLSearchParams("radius=zz&page=NaN&hitsPerPage="))
    expect(params.radius).toBe(20)
    expect(params.page).toBe(0)
    expect(params.hitsPerPage).toBe(20)
  })

  it("valeurs numériques valides conservées", () => {
    const params = parseSearchPageParams(new URLSearchParams("latitude=48.86&longitude=2.35&radius=60&page=2"))
    expect(params.latitude).toBe(48.86)
    expect(params.longitude).toBe(2.35)
    expect(params.radius).toBe(60)
    expect(params.page).toBe(2)
  })

  it("aller-retour parse → buildSearchUrl : une URL corrompue se répare (pas de NaN re-sérialisé)", () => {
    const params = parseSearchPageParams(new URLSearchParams("q=boulanger&latitude=abc&longitude=2.35&radius=zz&page=NaN"))
    const url = buildSearchUrl(params)
    expect(url).not.toContain("NaN")
    expect(url).not.toContain("latitude")
    expect(url).not.toContain("radius")
    expect(url).toContain("q=boulanger")
  })
})

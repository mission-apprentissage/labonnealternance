import { describe, expect, it } from "vitest"

import { buildPartnerSearchUrl, readPartnerGeo } from "./partner-search-link.utils"

const build = (query: string, resolution: { q: string | null; lieu_label: string | null } | null = { q: "Études et développement informatique", lieu_label: "Paris" }) => {
  const url = new URL(buildPartnerSearchUrl("monmaster", new URLSearchParams(query), resolution), "http://localhost")
  return { pathname: url.pathname, params: url.searchParams }
}

describe("readPartnerGeo", () => {
  it.each([
    ["latitude=48.85&longitude=2.35", { latitude: 48.85, longitude: 2.35 }],
    ["latitude=-21.1151&longitude=55.5364", { latitude: -21.1151, longitude: 55.5364 }],
    ["latitude=48&longitude=2", { latitude: 48, longitude: 2 }],
  ])("renvoie la paire quand les deux coordonnées sont exploitables : %s", (query, expected) => {
    expect(readPartnerGeo(new URLSearchParams(query))).toEqual(expected)
  })

  it.each([
    ["latitude seule", "latitude=48.85"],
    ["longitude seule", "longitude=2.35"],
    ["valeur non numérique", "latitude=abc&longitude=2.35"],
    ["latitude hors bornes", "latitude=91&longitude=2.35"],
    ["longitude hors bornes", "latitude=48.85&longitude=-181"],
    ["format legacy lat/lon", "lat=48.85&lon=2.35"],
    ["virgule décimale", "latitude=48,85&longitude=2,35"],
    ["suffixe non numérique", "latitude=48.85abc&longitude=2.35"],
    ["notation exponentielle", "latitude=4.885e1&longitude=2.35"],
  ])("renvoie null : %s", (_label, query) => {
    expect(readPartnerGeo(new URLSearchParams(query))).toBeNull()
  })
})

describe("buildPartnerSearchUrl", () => {
  it("construit une recherche emplois sur le métier et le lieu", () => {
    const { pathname, params } = build("latitude=48.85&longitude=2.35")

    expect(pathname).toBe("/recherche")
    expect(params.get("q")).toBe("Études et développement informatique")
    expect(params.get("lieu_label")).toBe("Paris")
    expect(params.get("latitude")).toBe("48.85")
    expect(params.get("longitude")).toBe("2.35")
    expect(params.has("mode")).toBe(false)
    expect(params.get("search_source")).toBe("partner_links")
    expect(params.get("utm_source")).toBe("monmaster")
  })

  it("garde search_source sur un repli géo seule (pas de q)", () => {
    const { params } = build("latitude=48.85&longitude=2.35", { q: null, lieu_label: "Paris" })

    expect(params.has("q")).toBe(false)
    expect(params.get("search_source")).toBe("partner_links")
    expect(params.get("latitude")).toBe("48.85")
  })

  it("renvoie /recherche nue attribuée au partenaire quand rien n'est résolu", () => {
    const { pathname, params } = build("", null)

    expect(pathname).toBe("/recherche")
    expect([...params.keys()].sort()).toEqual(["search_source", "utm_source"])
  })

  it("ne pose pas lieu_label sans paire de coordonnées", () => {
    const { params } = build("latitude=48.85")

    expect(params.has("lieu_label")).toBe(false)
    expect(params.has("latitude")).toBe(false)
  })

  it("reprend les utm du partenaire, utm_source compris", () => {
    const { params } = build("utm_source=monmaster-fiche&utm_medium=lien&utm_campaign=rentree-2027")

    expect(params.get("utm_source")).toBe("monmaster-fiche")
    expect(params.get("utm_medium")).toBe("lien")
    expect(params.get("utm_campaign")).toBe("rentree-2027")
  })

  it("ignore un utm de plus de 100 caractères", () => {
    const { params } = build(`utm_campaign=${"x".repeat(101)}`)
    expect(params.has("utm_campaign")).toBe(false)
  })

  it("ne laisse pas le partenaire écraser search_source ni poser d'autres paramètres", () => {
    const { pathname, params } = build("search_source=free_text&q=autre%20metier&mode=formations&from=https://evil.example&radius=200&opco=AKTO&page=50")

    expect(pathname).toBe("/recherche")
    expect(params.get("search_source")).toBe("partner_links")
    expect(params.get("q")).toBe("Études et développement informatique")
    for (const key of ["mode", "from", "radius", "opco", "page"]) expect(params.has(key)).toBe(false)
  })
})

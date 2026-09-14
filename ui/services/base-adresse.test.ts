import { afterEach, describe, expect, it, vi } from "vitest"

import { searchAddress } from "./base-adresse"

/**
 * Réponse modelée sur ce que renvoie data.geopf.fr pour « Breta » avec `index=address,poi` :
 * les items `poi` n'ont ni `label` ni `population`, et leurs `postcode` / `citycode` sont des
 * tableaux. L'ordre est volontairement défavorable (communes d'abord) pour tester le tri.
 */
const poi = (category: string, toponym: string, citycode: string, postcode?: string[]) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [-3.5, 48.1] },
  properties: { _type: "poi", toponym, name: [toponym], category: ["administratif", category], citycode: [citycode], ...(postcode ? { postcode } : {}), score: 0.9 },
})
const municipality = (label: string, citycode: string, postcode: string, population: number) => ({
  type: "Feature",
  geometry: { type: "Point", coordinates: [6.99, 47.59] },
  properties: { _type: "address", type: "municipality", label, name: label, citycode, postcode, population, score: 0.85 },
})

const stubFetch = (features: unknown[]) => {
  const fetchMock = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ features }) })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

afterEach(() => vi.unstubAllGlobals())

describe("searchAddress avec les entités administratives", () => {
  it("demande les deux index, et ne filtre poi que sur département et région", async () => {
    const fetchMock = stubFetch([])
    await searchAddress("Breta", undefined, undefined, true)
    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.searchParams.get("index")).toBe("address,poi")
    expect(url.searchParams.get("category")).toBe("département,région")
    // Sous 6 caractères, le filtre historique de l'index address reste posé.
    expect(url.searchParams.get("type")).toBe("municipality")
  })

  it("sans l'option, la requête est celle d'avant : index address seul, aucun filtre poi", async () => {
    const fetchMock = stubFetch([])
    await searchAddress("Breta")
    const url = new URL(fetchMock.mock.calls[0][0] as string)
    expect(url.searchParams.has("index")).toBe(false)
    expect(url.searchParams.has("category")).toBe(false)
  })

  it("région, puis département, puis les communes par population", async () => {
    stubFetch([
      municipality("Bretagne", "90019", "90130", 200),
      municipality("Bretagne-de-Marsan", "40055", "40280", 1400),
      poi("département", "Nord", "59"),
      municipality("Bretagne", "36024", "36110", 1000),
      poi("région", "Bretagne", "53"),
    ])
    const items = await searchAddress("Breta", undefined, undefined, true)
    expect(items.map((i) => i.label)).toEqual(["Bretagne", "Nord", "Bretagne-de-Marsan 40280", "Bretagne 36110", "Bretagne 90130"])
  })

  it("porte le code administratif et un libellé de liste explicite, sans toucher au libellé appliqué", async () => {
    stubFetch([poi("région", "Bretagne", "53"), poi("département", "Nord", "59")])
    const [bretagne, nord] = await searchAddress("Breta", undefined, undefined, true)
    expect(bretagne).toMatchObject({ label: "Bretagne", displayLabel: "Bretagne (région)", adminArea: "region:53", insee: "53", zipcode: "" })
    expect(nord).toMatchObject({ label: "Nord", displayLabel: "Nord (département)", adminArea: "departement:59" })
  })

  it("ne sérialise jamais un tableau de codes postaux dans le libellé", async () => {
    // Cas de la capture d'écran : « Bretagne 76200,76370 ». Exclu par le filtre category, mais le
    // mapping doit rester sain si le filtre s'élargit un jour.
    stubFetch([poi("commune", "Bretagne", "76136", ["76200", "76370"])])
    const [item] = await searchAddress("Breta", undefined, undefined, true)
    expect(item.label).toBe("Bretagne 76200")
    expect(item.zipcode).toBe("76200")
    expect(item.adminArea).toBeUndefined()
  })

  it("outre-mer : une seule ligne quand la région et le département portent le même nom, le département", async () => {
    stubFetch([poi("région", "Guadeloupe", "01"), poi("département", "Guadeloupe", "971"), poi("région", "Bretagne", "53")])
    const items = await searchAddress("Guad", undefined, undefined, true)
    expect(items.map((i) => i.displayLabel)).toEqual(["Bretagne (région)", "Guadeloupe (département)"])
    expect(items[1].adminArea).toBe("departement:971")
  })

  it("une commune de l'index address garde son format historique, sans adminArea ni displayLabel", async () => {
    stubFetch([municipality("Nantes", "44109", "44000", 320000)])
    const [nantes] = await searchAddress("Nantes", undefined, undefined, true)
    expect(nantes).toEqual({ value: { type: "Point", coordinates: [6.99, 47.59] }, insee: "44109", zipcode: "44000", label: "Nantes 44000" })
  })
})

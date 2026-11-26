import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { getStaticVilles } from "./get-static-data"

// Emprises larges de chaque territoire, par préfixe de code INSEE : elles attrapent une latitude et
// une longitude inversées, des coordonnées nulles ou celles d'une homonyme d'un autre territoire.
const TERRITOIRES = [
  { nom: "Guadeloupe", insee: /^971/, lon: [-61.9, -60.9], lat: [15.8, 16.6] },
  { nom: "Martinique", insee: /^972/, lon: [-61.3, -60.7], lat: [14.3, 15] },
  { nom: "Guyane", insee: /^973/, lon: [-54.7, -51.5], lat: [2, 5.9] },
  { nom: "La Réunion", insee: /^974/, lon: [55.2, 55.9], lat: [-21.45, -20.85] },
  { nom: "Mayotte", insee: /^976/, lon: [44.9, 45.4], lat: [-13.1, -12.6] },
  { nom: "Métropole", insee: /^(?!97)/, lon: [-5.5, 9.7], lat: [41.3, 51.2] },
] as const

const villes = getStaticVilles(join(import.meta.dirname, "../config"))

describe("villes.txt", () => {
  it("contient les villes des pages /metiers", () => {
    expect(villes.length).toBeGreaterThan(50)
  })

  it.each(villes.map((ville) => [ville.name, ville] as const))("%s : coordonnées dans son territoire", (_nom, ville) => {
    const lon = Number(ville.lon)
    const lat = Number(ville.lat)
    const territoire = TERRITOIRES.find((t) => t.insee.test(ville.insee))
    const dedans = territoire !== undefined && lon >= territoire.lon[0] && lon <= territoire.lon[1] && lat >= territoire.lat[0] && lat <= territoire.lat[1]
    expect({ insee: ville.insee, territoire: territoire?.nom, lon, lat, dedans }).toMatchObject({ dedans: true })
  })
})

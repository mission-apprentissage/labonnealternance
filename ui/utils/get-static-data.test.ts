import { join } from "node:path"
import { describe, expect, it } from "vitest"

import { getStaticVilles } from "./get-static-data"

// Emprises larges de chaque territoire, par préfixe de code INSEE : elles attrapent une latitude et
// une longitude inversées, des coordonnées nulles ou celles d'une homonyme d'un autre territoire.
// La position fine se contrôle contre la mairie avec ui/scripts/check-villes-coordinates.mjs (réseau, hors CI).
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

  // Le nom fait le texte des liens des pages /metiers : deux liens identiques vers deux lieux différents (RGAA 6.1).
  it("donne à chaque ville un nom distinct", () => {
    const noms = villes.map((ville) => ville.name)
    expect(noms.filter((nom, index) => noms.indexOf(nom) !== index)).toEqual([])
  })

  it.each(villes.map((ville) => [ville.name, ville.insee, ville] as const))("%s (%s) : coordonnées dans son territoire", (_nom, _insee, ville) => {
    const lon = Number(ville.lon)
    const lat = Number(ville.lat)
    const territoire = TERRITOIRES.find((t) => t.insee.test(ville.insee))
    const dedans = territoire !== undefined && lon >= territoire.lon[0] && lon <= territoire.lon[1] && lat >= territoire.lat[0] && lat <= territoire.lat[1]
    expect(dedans, `${territoire?.nom ?? "territoire inconnu"} : lon ${lon}, lat ${lat}`).toBe(true)
  })
})

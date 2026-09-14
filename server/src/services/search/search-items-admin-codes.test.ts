import { describe, expect, it } from "vitest"

import type { AdminCodeIndex } from "./search-items-admin-codes"
import { addCommune, emptyAdminCodeIndex, normalizeInsee, normalizeZipcode, resolveAdminCodes } from "./search-items-admin-codes"

const point = (lon: number, lat: number) => ({ type: "Point" as const, coordinates: [lon, lat] as [number, number] })

/**
 * Référentiel de test réduit aux cas qui comptent, tous relevés en production le 2026-09-11 :
 * un CP monodépartemental, le CP 42620 à cheval Allier/Loire, Paris (commune 75056, dont le
 * catalogue code les arrondissements 751xx), la Corse (20xxx ambigu 2A/2B), la Guadeloupe (971,
 * même préfixe postal que Saint-Martin et Saint-Barthélemy qui n'en font pas partie).
 * Les bbox se recouvrent volontairement entre Nantes et Rezé pour tester le départage.
 */
const buildIndex = (): AdminCodeIndex => {
  const index = emptyAdminCodeIndex()
  addCommune(index, {
    insee: "44109",
    departement_code: "44",
    region_code: "52",
    zipcodes: ["44000", "44100", "44200", "44300"],
    centre: [-1.55, 47.22],
    bbox: [-1.64, 47.18, -1.48, 47.3],
  })
  addCommune(index, { insee: "44143", departement_code: "44", region_code: "52", zipcodes: ["44400"], centre: [-1.57, 47.18], bbox: [-1.62, 47.15, -1.5, 47.21] })
  addCommune(index, { insee: "42147", departement_code: "42", region_code: "84", zipcodes: ["42620"], centre: [3.75, 46.28], bbox: [3.7, 46.24, 3.8, 46.32] })
  addCommune(index, { insee: "03119", departement_code: "03", region_code: "84", zipcodes: ["42620"], centre: [3.8, 46.31], bbox: [3.76, 46.28, 3.86, 46.36] })
  addCommune(index, { insee: "75056", departement_code: "75", region_code: "11", zipcodes: ["75001", "75015"], centre: [2.35, 48.86], bbox: [2.22, 48.81, 2.47, 48.9] })
  addCommune(index, { insee: "2A004", departement_code: "2A", region_code: "94", zipcodes: ["20000"], centre: [8.74, 41.93], bbox: [8.6, 41.85, 8.85, 42.0] })
  addCommune(index, { insee: "2B033", departement_code: "2B", region_code: "94", zipcodes: ["20200"], centre: [9.45, 42.7], bbox: [9.4, 42.65, 9.5, 42.75] })
  addCommune(index, { insee: "97105", departement_code: "971", region_code: "01", zipcodes: ["97110"], centre: [-61.53, 16.24], bbox: [-61.6, 16.2, -61.48, 16.3] })
  return index
}

const NONE = { departement_code: null, region_code: null }
const NANTES = { departement_code: "44", region_code: "52" }
const PARIS = { departement_code: "75", region_code: "11" }

describe("resolveAdminCodes", () => {
  const index = buildIndex()

  describe("dit non quand il faut", () => {
    it("sans aucune source", () => {
      expect(resolveAdminCodes({}, index)).toEqual(NONE)
    })

    it("CP à cheval sans géopoint : on ne choisit pas au hasard", () => {
      expect(resolveAdminCodes({ zipcode: "42620" }, index)).toEqual(NONE)
    })

    it("Saint-Martin et Saint-Barthélemy ne sont pas la Guadeloupe malgré le préfixe 971", () => {
      // Sans géopoint : la règle de numérotation doit être court-circuitée.
      expect(resolveAdminCodes({ zipcode: "97150" }, index)).toEqual(NONE)
      expect(resolveAdminCodes({ zipcode: "97133" }, index)).toEqual(NONE)
      // Avec géopoint réel (Marigot, 250 km de la Guadeloupe) : hors de toute bbox.
      expect(resolveAdminCodes({ zipcode: "97150", geopoint: point(-63.08, 18.07) }, index)).toEqual(NONE)
    })

    it("Corse : un CP 20xxx inconnu ne se tranche pas par la numérotation, 2A ou 2B", () => {
      expect(resolveAdminCodes({ zipcode: "20090" }, index)).toEqual(NONE)
    })

    it("CP inconnu d'un département inconnu du référentiel", () => {
      expect(resolveAdminCodes({ zipcode: "99123" }, index)).toEqual(NONE)
    })

    it("géopoint hors de toute bbox (en mer)", () => {
      expect(resolveAdminCodes({ geopoint: point(-5.0, 46.0) }, index)).toEqual(NONE)
    })

    it("un INSEE inconnu n'est pas une preuve : on retombe sur le CP, qui reste à cheval", () => {
      expect(resolveAdminCodes({ insee: "00000", zipcode: "42620" }, index)).toEqual(NONE)
    })
  })

  describe("étape 1 : code INSEE", () => {
    it("prime sur un CP contradictoire", () => {
      expect(resolveAdminCodes({ insee: "44109", zipcode: "75001" }, index)).toEqual(NANTES)
    })

    it("ramène un arrondissement de Paris, Lyon ou Marseille à sa commune", () => {
      expect(resolveAdminCodes({ insee: "75115" }, index)).toEqual(PARIS)
      expect(normalizeInsee("69389")).toBe("69123")
      expect(normalizeInsee("13212")).toBe("13055")
    })

    it("ne touche pas aux autres codes, Corse comprise", () => {
      expect(normalizeInsee("2a004")).toBe("2A004")
      expect(normalizeInsee("74011")).toBe("74011")
      expect(normalizeInsee("7501")).toBeNull()
    })
  })

  describe("étape 2 : code postal connu", () => {
    it("un seul département derrière le CP", () => {
      expect(resolveAdminCodes({ zipcode: "44400" }, index)).toEqual(NANTES)
    })

    it("CP à cheval tranché par la commune du CP la plus proche du géopoint", () => {
      expect(resolveAdminCodes({ zipcode: "42620", geopoint: point(3.74, 46.27) }, index).departement_code).toBe("42")
      expect(resolveAdminCodes({ zipcode: "42620", geopoint: point(3.81, 46.32) }, index).departement_code).toBe("03")
    })

    it("CP mal formé mais récupérable", () => {
      expect(resolveAdminCodes({ zipcode: "44 400" }, index)).toEqual(NANTES)
    })

    it("Corse résolue par le référentiel quand le CP y est", () => {
      expect(resolveAdminCodes({ zipcode: "20200" }, index)).toEqual({ departement_code: "2B", region_code: "94" })
    })
  })

  describe("étape 3 : CP inconnu de forme départementale", () => {
    it("CEDEX : le département est dans le code", () => {
      expect(resolveAdminCodes({ zipcode: "75948" }, index)).toEqual(PARIS)
      expect(resolveAdminCodes({ zipcode: "44406" }, index)).toEqual(NANTES)
    })

    it("75000 et 13000 sans arrondissement", () => {
      expect(resolveAdminCodes({ zipcode: "75000" }, index)).toEqual(PARIS)
    })

    it("outre-mer sur trois chiffres", () => {
      expect(resolveAdminCodes({ zipcode: "97464" }, index)).toEqual(NONE) // 974 absent de l'index de test : pas d'invention
      expect(resolveAdminCodes({ zipcode: "97190" }, index)).toEqual({ departement_code: "971", region_code: "01" })
    })
  })

  describe("étape 4 : géopoint seul", () => {
    it("commune dont la bbox contient le point", () => {
      expect(resolveAdminCodes({ geopoint: point(2.35, 48.86) }, index)).toEqual(PARIS)
    })

    it("bbox qui se recouvrent : la commune au centre le plus proche", () => {
      // Dans les deux bbox Nantes/Rezé, plus près du centre de Rezé.
      expect(resolveAdminCodes({ geopoint: point(-1.57, 47.19) }, index)).toEqual(NANTES)
    })

    it("Corse ambiguë tranchée par le géopoint", () => {
      expect(resolveAdminCodes({ zipcode: "20090", geopoint: point(8.74, 41.93) }, index).departement_code).toBe("2A")
      expect(resolveAdminCodes({ zipcode: "20090", geopoint: point(9.45, 42.7) }, index).departement_code).toBe("2B")
    })
  })
})

describe("normalizeZipcode", () => {
  it.each([
    [null, null],
    ["", null],
    ["abc", null],
    ["123456", null],
    ["44000", "44000"],
    ["44 000", "44000"],
    ["4400", "04400"],
    ["1000", "01000"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeZipcode(input)).toBe(expected)
  })
})

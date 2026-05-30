import assert from "assert"

import { describe, it } from "vitest"

import { convertStringCoordinatesToGeoPoint, getDistanceInKm, matchesDepartment, roundDistance } from "@/common/utils/geolib"

describe("geolib", () => {
  describe("getDistanceInKm", () => {
    it("Calcule la distance entre deux points identiques - distance zéro", () => {
      const coordinate = {
        origin: { latitude: 48.8566, longitude: 2.3522 },
        destination: { latitude: 48.8566, longitude: 2.3522 },
      }

      const result = getDistanceInKm(coordinate)
      assert.strictEqual(result, 0)
    })

    it("Calcule la distance entre Paris et Lyon", () => {
      const coordinate = {
        origin: { latitude: 48.8566, longitude: 2.3522 }, // Paris
        destination: { latitude: 45.7642, longitude: 4.8357 }, // Lyon
      }

      const result = getDistanceInKm(coordinate)
      // Distance approximative: ~390-410 km
      assert.ok(result > 380, `Distance should be greater than 380km, got ${result}`)
      assert.ok(result < 420, `Distance should be less than 420km, got ${result}`)
    })

    it("Calcule la distance entre Paris et Marseille", () => {
      const coordinate = {
        origin: { latitude: 48.8566, longitude: 2.3522 }, // Paris
        destination: { latitude: 43.2965, longitude: 5.3698 }, // Marseille
      }

      const result = getDistanceInKm(coordinate)
      // Distance approximative: ~660-680 km
      assert.ok(result > 650, `Distance should be greater than 650km, got ${result}`)
      assert.ok(result < 700, `Distance should be less than 700km, got ${result}`)
    })

    it("Retourne un nombre entier positif ou zéro", () => {
      const coordinate = {
        origin: { latitude: 48.8566, longitude: 2.3522 },
        destination: { latitude: 45.7642, longitude: 4.8357 },
      }

      const result = getDistanceInKm(coordinate)
      assert.ok(Number.isInteger(result), "Result should be an integer")
      assert.ok(result >= 0, "Result should be positive or zero")
    })

    it("Calcule correctement la distance avec les coordonnées inversées", () => {
      const coordinates1 = {
        origin: { latitude: 48.8566, longitude: 2.3522 },
        destination: { latitude: 45.7642, longitude: 4.8357 },
      }

      const coordinates2 = {
        origin: { latitude: 45.7642, longitude: 4.8357 },
        destination: { latitude: 48.8566, longitude: 2.3522 },
      }

      const result1 = getDistanceInKm(coordinates1)
      const result2 = getDistanceInKm(coordinates2)

      // La distance devrait être symétrique
      assert.strictEqual(result1, result2, "Distance should be the same regardless of direction")
    })
  })

  describe("roundDistance", () => {
    it("Arrondit la distance avec la précision par défaut (2 décimales)", () => {
      const result = roundDistance(45.6789)
      assert.strictEqual(result, 45.68)
    })

    it("Arrondit la distance avec une précision personnalisée", () => {
      const result = roundDistance(45.6789, 1)
      assert.strictEqual(result, 45.7)
    })

    it("Arrondit la distance avec zéro décimale", () => {
      const result = roundDistance(45.6789, 0)
      assert.strictEqual(result, 46)
    })
  })

  describe("convertStringCoordinatesToGeoPoint", () => {
    it("Convertit une chaîne de coordonnées au format GeoPoint", () => {
      const coordinates = "48.8566,2.3522"
      const result = convertStringCoordinatesToGeoPoint(coordinates)

      assert.strictEqual(result.type, "Point")
      assert.deepStrictEqual(result.coordinates, [2.3522, 48.8566])
    })

    it("Inverse correctement l'ordre des coordonnées (lat,lon -> lon,lat)", () => {
      const coordinates = "45.7642,4.8357"
      const result = convertStringCoordinatesToGeoPoint(coordinates)

      assert.strictEqual(result.coordinates[0], 4.8357)
      assert.strictEqual(result.coordinates[1], 45.7642)
    })
  })

  describe("matchesDepartment", () => {
    it("Retourne true pour un code postal correspondant au département", () => {
      const result = matchesDepartment("75001", ["75"])
      assert.strictEqual(result, true)
    })

    it("Retourne false pour un code postal ne correspondant pas au département", () => {
      const result = matchesDepartment("69001", ["75"])
      assert.strictEqual(result, false)
    })

    it("Gère la Corse 2A correctement", () => {
      const result2A = matchesDepartment("20001", ["2A"])
      const result201 = matchesDepartment("20100", ["2A"])
      assert.strictEqual(result2A, true)
      assert.strictEqual(result201, true)
    })

    it("Gère la Corse 2B correctement", () => {
      const result202 = matchesDepartment("20200", ["2B"])
      const result206 = matchesDepartment("20600", ["2B"])
      assert.strictEqual(result202, true)
      assert.strictEqual(result206, true)
    })

    it("Gère les DROM-COM (971-979) correctement", () => {
      const result971 = matchesDepartment("97100", ["971"])
      const result974 = matchesDepartment("97400", ["974"])
      assert.strictEqual(result971, true)
      assert.strictEqual(result974, true)
    })

    it("Retourne true si le code postal correspond à l'un des départements", () => {
      const result = matchesDepartment("69001", ["75", "69", "13"])
      assert.strictEqual(result, true)
    })

    it("Retourne false si le code postal ne correspond à aucun département", () => {
      const result = matchesDepartment("69001", ["75", "13", "92"])
      assert.strictEqual(result, false)
    })
  })
})

import { describe, expect, it } from "vitest"
import { isAutoRadiusWidening } from "./auto-radius.js"

describe("isAutoRadiusWidening", () => {
  const point = { latitude: 44.93, longitude: 2.44, radius: 20 }

  it("est faux dès qu'un résultat est vu par l'usager, ou en erreur", () => {
    expect(isAutoRadiusWidening(point, 1)).toBe(false)
    expect(isAutoRadiusWidening(point, null)).toBe(false)
  })

  it("est faux quand l'élargissement ne s'applique pas : 100 km atteints, emprise administrative, sans lieu complet", () => {
    expect(isAutoRadiusWidening({ ...point, radius: 100 }, 0)).toBe(false)
    expect(isAutoRadiusWidening({ ...point, admin_area: "departement:15" }, 0)).toBe(false)
    expect(isAutoRadiusWidening({ radius: 20 }, 0)).toBe(false)
    expect(isAutoRadiusWidening({ latitude: 44.93, radius: 20 }, 0)).toBe(false)
  })

  it("est vrai sur un palier intermédiaire : 0 résultat autour d'un point sous 100 km", () => {
    expect(isAutoRadiusWidening(point, 0)).toBe(true)
    expect(isAutoRadiusWidening({ ...point, radius: 80 }, 0)).toBe(true)
  })
})

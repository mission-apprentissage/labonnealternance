import { OPCOS_LABEL } from "shared/constants/recruteur"
import { describe, expect, it } from "vitest"
import { isIdentifiedOpco, OPCO_SHORT_LABELS } from "./opco-labels"

describe("isIdentifiedOpco", () => {
  it("écarte inconnu, multiple et l'absence de valeur", () => {
    expect(isIdentifiedOpco(OPCOS_LABEL.UNKNOWN_OPCO)).toBe(false)
    expect(isIdentifiedOpco(OPCOS_LABEL.MULTIPLE_OPCO)).toBe(false)
    expect(isIdentifiedOpco(undefined)).toBe(false)
    expect(isIdentifiedOpco(null)).toBe(false)
  })

  it("ne se laisse pas tromper par une clé héritée de l'objet", () => {
    expect(isIdentifiedOpco("toString" as OPCOS_LABEL)).toBe(false)
  })

  it("reconnaît chaque autre OPCO de l'enum", () => {
    const identified = Object.values(OPCOS_LABEL).filter((opco) => opco !== OPCOS_LABEL.UNKNOWN_OPCO && opco !== OPCOS_LABEL.MULTIPLE_OPCO)

    expect(identified.filter((opco) => !isIdentifiedOpco(opco))).toEqual([])
    expect(Object.keys(OPCO_SHORT_LABELS)).toHaveLength(identified.length)
  })
})

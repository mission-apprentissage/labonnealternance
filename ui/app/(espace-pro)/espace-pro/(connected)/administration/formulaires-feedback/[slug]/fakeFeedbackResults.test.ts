import { describe, expect, it } from "vitest"

import { toShares } from "./fakeFeedbackResults"

describe("toShares", () => {
  it("arrondit en pourcentages entiers dont la somme fait 100", () => {
    expect(toShares([1, 1, 1])).toEqual([34, 33, 33])
    expect(toShares([71, 21, 8])).toEqual([71, 21, 8])
    expect(toShares([3, 7, 11, 2]).reduce((sum, share) => sum + share, 0)).toBe(100)
  })

  it("renvoie des zéros sans poids", () => {
    expect(toShares([0, 0])).toEqual([0, 0])
  })
})

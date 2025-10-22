import { describe, expect, it } from "vitest"

import { deduplicate, deduplicateBy, getPairs } from "./array"

describe("array", () => {
  describe("getPairs", () => {
    it("should return possible pairs of items from an array", () => {
      expect(getPairs([4, 5, 6])).toEqual([
        [4, 5],
        [4, 6],
        [5, 6],
      ])
    })
  })
  describe("deduplicate", () => {
    it("should remove duplicate values and keep the order", () => {
      expect(deduplicate([3, 4, 5, 6, 6, 5, 4, 3])).toEqual([3, 4, 5, 6])
    })
  })
  describe("deduplicateBy", () => {
    it("should remove duplicate values for complex objects", () => {
      expect(
        deduplicateBy(
          [3, 4, 3, 4, 6, 5, 4, 6].map((x, index) => ({ value: x, index })),
          (x) => x.value
        )
      ).toEqual([
        { value: 3, index: 0 },
        { value: 4, index: 1 },
        { value: 6, index: 4 },
        { value: 5, index: 5 },
      ])
    })
  })
})

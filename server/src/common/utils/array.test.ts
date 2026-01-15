import { describe, expect, it } from "vitest"

import { deduplicate, deduplicateBy, getPairs, partition } from "./array"

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
  describe("partition", () => {
    it("should separate array elements based on test function", () => {
      const result = partition([1, 2, 3, 4, 5, 6], (x) => x % 2 === 0)
      expect(result).toEqual({
        match: [2, 4, 6],
        notMatch: [1, 3, 5],
      })
    })

    it("should handle empty array", () => {
      const result = partition([], (x) => x > 0)
      expect(result).toEqual({
        match: [],
        notMatch: [],
      })
    })

    it("should handle all elements matching", () => {
      const result = partition([2, 4, 6, 8], (x) => x % 2 === 0)
      expect(result).toEqual({
        match: [2, 4, 6, 8],
        notMatch: [],
      })
    })

    it("should handle no elements matching", () => {
      const result = partition([1, 3, 5, 7], (x) => x % 2 === 0)
      expect(result).toEqual({
        match: [],
        notMatch: [1, 3, 5, 7],
      })
    })

    it("should pass index to test function", () => {
      const result = partition(["a", "b", "c", "d"], (_, index) => index < 2)
      expect(result).toEqual({
        match: ["a", "b"],
        notMatch: ["c", "d"],
      })
    })

    it("should work with complex objects", () => {
      const items = [
        { id: 1, active: true },
        { id: 2, active: false },
        { id: 3, active: true },
        { id: 4, active: false },
      ]
      const result = partition(items, (item) => item.active)
      expect(result).toEqual({
        match: [
          { id: 1, active: true },
          { id: 3, active: true },
        ],
        notMatch: [
          { id: 2, active: false },
          { id: 4, active: false },
        ],
      })
    })
  })
})

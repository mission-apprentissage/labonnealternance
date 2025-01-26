import { describe, expect, it } from "vitest"

import { joinNonNullStrings, removeAccents } from "./stringUtils.js"

describe("stringUtils", () => {
  describe("removeAccents", () => {
    it("should remove standard accents", () => {
      expect(removeAccents("àâä")).toBe("aaa")
      expect(removeAccents("éêëè")).toBe("eeee")
      expect(removeAccents("ïî")).toBe("ii")
      expect(removeAccents("ôö")).toBe("oo")
      expect(removeAccents("üùû")).toBe("uuu")
      expect(removeAccents("ÿŷ")).toBe("yy")
    })
    it("should remove ç => c", () => {
      expect(removeAccents("ç")).toBe("c")
    })
    it("should remove accents from capital letters", () => {
      expect(removeAccents("ÄÂÊËÏÎÔÖÛÜŸŶ")).toBe("AAEEIIOOUUYY")
    })
    it("should not change standard characters", () => {
      const unchanged = `&"'(-_)=$*µ$£%!§:/;.,?~#{}[]|^@\``
      expect(removeAccents(unchanged)).toBe(unchanged)
    })
  })

  describe("joinNonNullStrings", () => {
    it("should return a single trimmed string when all values are non-null", () => {
      expect(joinNonNullStrings(["0", " Hello ", "world ", "Vitest"])).toBe("0 Hello world Vitest")
    })

    it("should ignore null values and return a single trimmed string", () => {
      expect(joinNonNullStrings([" Hello ", null, "world", " ", null])).toBe("Hello world")
    })

    it("should return null if all values are null", () => {
      expect(joinNonNullStrings([null, null, null])).toBe(null)
    })

    it("should return null if array is empty", () => {
      expect(joinNonNullStrings([])).toBe(null)
    })

    it("should handle an array with mixed whitespace and nulls correctly", () => {
      expect(joinNonNullStrings(["  ", null, " Hello ", " ", null, "world"])).toBe("Hello world")
    })

    it("should return a single word if only one non-null value is present", () => {
      expect(joinNonNullStrings([null, " Vitest ", null])).toBe("Vitest")
    })
  })
})

import { describe, expect, it } from "vitest"

import { LBA_ITEM_TYPE } from "../constants/lbaitem.js"

import { buildJobUrl, buildTrainingUrl, getDirectJobPath, joinNonNullStrings, removeAccents } from "./stringUtils.js"

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

  describe("buildJobUrl", () => {
    it("should build a job URL", () => {
      expect(buildJobUrl(LBA_ITEM_TYPE.RECRUTEURS_LBA, "123", "Job Title")).toBe("/emploi/recruteurs_lba/123/job-title")
    })
  })

  describe("buildTrainingUrl", () => {
    it("should build a training URL", () => {
      expect(buildTrainingUrl("123#aaa", "Job Title")).toBe("/formation/123%23aaa/job-title")
    })
  })

  describe("getDirectJobPath", () => {
    it("should build a direct job path", () => {
      expect(getDirectJobPath("123")).toBe("/emploi/offres_emploi_lba/123/offre")
    })

    it("should build a direct job path with title", () => {
      expect(getDirectJobPath("123", "titre de l'offre")).toBe("/emploi/offres_emploi_lba/123/titre-de-l-offre")
    })
  })
})

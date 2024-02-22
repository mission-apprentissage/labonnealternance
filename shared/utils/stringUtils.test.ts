import { describe, it, expect } from "vitest"

import { removeAccents } from "./stringUtils"

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
})

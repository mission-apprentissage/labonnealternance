import { describe, expect, it } from "vitest"
import { AMELIORER_IA_MAX_USAGES, getAiRewriteAttempt } from "./ameliorer-ia.utils"

describe("getAiRewriteAttempt", () => {
  it("numérote les tentatives de 1 jusqu'au quota, à partir des crédits restants", () => {
    expect(getAiRewriteAttempt(AMELIORER_IA_MAX_USAGES)).toBe(1)
    expect(getAiRewriteAttempt(1)).toBe(AMELIORER_IA_MAX_USAGES)
  })

  it("couvre tout le quota sans trou ni doublon", () => {
    const rangs = Array.from({ length: AMELIORER_IA_MAX_USAGES }, (_, i) => getAiRewriteAttempt(AMELIORER_IA_MAX_USAGES - i))
    expect(rangs).toEqual(Array.from({ length: AMELIORER_IA_MAX_USAGES }, (_, i) => i + 1))
  })

  it("ne renvoie jamais un rang supérieur au quota tant qu'il reste un crédit", () => {
    // garde-fou : le bouton est désactivé à 0 crédit, aucun appel ne doit produire un rang hors borne
    for (let remaining = AMELIORER_IA_MAX_USAGES; remaining >= 1; remaining--) {
      expect(getAiRewriteAttempt(remaining)).toBeLessThanOrEqual(AMELIORER_IA_MAX_USAGES)
    }
  })
})

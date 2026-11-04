import { describe, expect, it } from "vitest"
import { formatSlackTable } from "./slack-utils"

describe("formatSlackTable", () => {
  it("aligne les colonnes dans un bloc de code, à droite pour les nombres", () => {
    const lines = formatSlackTable(
      ["Partenaire", "Reçues", "Motif"],
      [
        ["France Travail", "13998", "CFA_BLACKLISTED 6415"],
        ["PASS", "4", ""],
      ],
      { alignRight: [false, true, false] }
    )

    expect(lines).toEqual(["```", "Partenaire     Reçues Motif", "France Travail  13998 CFA_BLACKLISTED 6415", "PASS                4", "```"])
  })

  it("(faux positif) un tableau sans ligne garde l'en-tête", () => {
    expect(formatSlackTable(["A", "B"], [])).toEqual(["```", "A B", "```"])
  })
})

import { afterEach, describe, expect, it, vi } from "vitest"
import { getOpcoGuideLandingSection, trackOpcoGuideLinkClicked } from "./opco-guide.utils"

describe("getOpcoGuideLandingSection", () => {
  it.each(["", "#", "#guide-comptes-bis", "#GUIDE-COMPTES", "guide-comptes", "#contact@exemple.fr"])("ne transmet pas un hash inconnu : %j", (hash) => {
    expect(getOpcoGuideLandingSection(hash)).toBe("non_renseigné")
  })

  it("transmet l'ancre d'une section du guide", () => {
    expect(getOpcoGuideLandingSection("#guide-comptes")).toBe("guide-comptes")
  })
})

describe("trackOpcoGuideLinkClicked", () => {
  afterEach(() => vi.unstubAllGlobals())

  it("pousse l'événement avec le point d'entrée lu par la balise", () => {
    const mtm: unknown[] = []
    vi.stubGlobal("window", { _mtm: mtm })

    trackOpcoGuideLinkClicked("offres_moderation")

    expect(mtm).toEqual([{ event: "opco_guide_link_clicked", opco_guide_entry_point: "offres_moderation" }])
  })
})

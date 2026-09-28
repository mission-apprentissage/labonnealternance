import { describe, expect, it } from "vitest"

import { publicConfig } from "@/config.public"
import { isExternalHref, resolveContextChange } from "./link.utils"

const internalUrl = `${publicConfig.baseUrl}/faq`

describe("isExternalHref", () => {
  it("traite un lien vers un autre domaine comme externe", () => {
    expect(isExternalHref("https://travail-emploi.gouv.fr/", "auto")).toBe(true)
  })

  it("ne traite pas un chemin relatif comme externe", () => {
    expect(isExternalHref("/faq", "auto")).toBe(false)
  })

  it("ne traite pas une URL absolue du site comme externe", () => {
    expect(isExternalHref(internalUrl, "auto")).toBe(false)
  })

  it("traite un mailto comme externe", () => {
    expect(isExternalHref("mailto:contact@example.fr", "auto")).toBe(true)
  })

  it("ne traite pas un tel comme externe", () => {
    expect(isExternalHref("tel:0102030405", "auto")).toBe(false)
  })

  it("respecte la prop external forcée dans les deux sens", () => {
    expect(isExternalHref("/faq", true)).toBe(true)
    expect(isExternalHref("https://travail-emploi.gouv.fr/", false)).toBe(false)
  })

  it("ne considère pas comme externe un href non textuel", () => {
    expect(isExternalHref({ pathname: "/faq" }, "auto")).toBe(false)
  })
})

describe("resolveContextChange", () => {
  it("annonce une nouvelle fenêtre pour un lien http externe", () => {
    expect(resolveContextChange("https://travail-emploi.gouv.fr/", "auto")).toBe("window")
  })

  it("annonce l'ouverture de la messagerie pour un mailto", () => {
    expect(resolveContextChange("mailto:contact@example.fr", "auto")).toBe("mail")
  })

  it("n'annonce rien pour un lien interne", () => {
    expect(resolveContextChange("/faq", "auto")).toBe(null)
  })

  it("n'annonce rien pour un tel, qui ne reçoit pas de target", () => {
    expect(resolveContextChange("tel:0102030405", "auto")).toBe(null)
  })

  it("annonce une nouvelle fenêtre dès que external force le target", () => {
    expect(resolveContextChange("/faq", true)).toBe("window")
    expect(resolveContextChange({ pathname: "/faq" }, true)).toBe("window")
  })
})

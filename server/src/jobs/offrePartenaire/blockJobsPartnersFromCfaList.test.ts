import { describe, expect, it } from "vitest"

import { isCompanyInBlockedCfaList } from "@/jobs/offrePartenaire/blockJobsPartnersFromCfaList"

describe("cfaExiste (insensible à la casse et aux accents)", () => {
  it("devrait trouver les CFA avec casse et accents exacts", () => {
    expect(isCompanyInBlockedCfaList("AFTEC Caen")).toBe(true)
    expect(isCompanyInBlockedCfaList("École de Management Appliqué (EMA)")).toBe(true)
  })

  it("devrait trouver les CFA même sans respecter la casse", () => {
    expect(isCompanyInBlockedCfaList("aftec caen")).toBe(true)
    expect(isCompanyInBlockedCfaList("ipac bachelor factory caen")).toBe(true)
    expect(isCompanyInBlockedCfaList("efrei - grande école du numérique")).toBe(true)
  })

  it("devrait trouver les CFA même avec des accents supprimés ou remplacés", () => {
    expect(isCompanyInBlockedCfaList("ecole de management applique (ema)")).toBe(true)
    expect(isCompanyInBlockedCfaList("ecoles aftec")).toBe(true)
    expect(isCompanyInBlockedCfaList("ecole intuit lab")).toBe(true)
    expect(isCompanyInBlockedCfaList("efrei - grande ecole du numerique")).toBe(true)
    expect(isCompanyInBlockedCfaList("icans | institut de cancerologie strasbourg europe")).toBe(true) // volontairement faux sur orthographe mais sans accents
  })

  it("devrait trouver les CFA avec des variations mixtes", () => {
    expect(isCompanyInBlockedCfaList("afpa PAYS DE savoie")).toBe(true)
    expect(isCompanyInBlockedCfaList("IPAC BACHELOR FACTORY vannes")).toBe(true)
    expect(isCompanyInBlockedCfaList("Institut europeen de formation")).toBe(true)
    expect(isCompanyInBlockedCfaList("CIO'sup drome-ardeche")).toBe(true)
  })

  it("ne doit pas trouver un CFA qui n'existe pas", () => {
    expect(isCompanyInBlockedCfaList("CFA Bidon")).toBe(false)
    expect(isCompanyInBlockedCfaList("AFTEC Toulouse")).toBe(false)
    expect(isCompanyInBlockedCfaList("Université Inconnue")).toBe(false)
  })
})

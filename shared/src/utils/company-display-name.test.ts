import { describe, expect, it } from "vitest"

import { getJobCompanyDisplayName, getWorkplaceDisplayName } from "./company-display-name.js"

describe("getWorkplaceDisplayName", () => {
  it("raison sociale seule : renvoie la raison sociale", () => {
    expect(getWorkplaceDisplayName({ workplace_name: null, workplace_brand: null, workplace_legal_name: "SAS DUPONT" })).toBe("SAS DUPONT")
  })

  it("raison sociale + enseigne : l'enseigne prime sur la raison sociale", () => {
    expect(getWorkplaceDisplayName({ workplace_name: null, workplace_brand: "Boulangerie Dupont", workplace_legal_name: "SAS DUPONT" })).toBe("Boulangerie Dupont")
  })

  it("workplace_name prime sur l'enseigne et la raison sociale", () => {
    expect(getWorkplaceDisplayName({ workplace_name: "Dupont Lyon", workplace_brand: "Boulangerie Dupont", workplace_legal_name: "SAS DUPONT" })).toBe("Dupont Lyon")
  })

  it('workplace_name vide (sanitizé en "") : repli sur l\'enseigne', () => {
    expect(getWorkplaceDisplayName({ workplace_name: "", workplace_brand: "Boulangerie Dupont", workplace_legal_name: "SAS DUPONT" })).toBe("Boulangerie Dupont")
  })

  it("aucun nom : null", () => {
    expect(getWorkplaceDisplayName({ workplace_name: "", workplace_brand: null, workplace_legal_name: null })).toBeNull()
  })
})

describe("getJobCompanyDisplayName", () => {
  const workplace = { workplace_name: null, workplace_brand: "Boulangerie Dupont", workplace_legal_name: "SAS DUPONT" }

  it("offre déléguée : renvoie le CFA, pas l'entreprise", () => {
    expect(getJobCompanyDisplayName({ ...workplace, is_delegated: true, cfa_legal_name: "CFA DES METIERS" })).toBe("CFA DES METIERS")
  })

  it("offre déléguée sans nom de CFA : null, sans repli sur l'entreprise", () => {
    expect(getJobCompanyDisplayName({ ...workplace, is_delegated: true, cfa_legal_name: null })).toBeNull()
  })

  it("offre non déléguée avec un cfa_legal_name résiduel : l'entreprise", () => {
    expect(getJobCompanyDisplayName({ ...workplace, is_delegated: false, cfa_legal_name: "CFA DES METIERS" })).toBe("Boulangerie Dupont")
  })
})

import { FlowCreationCfa } from "../pages/FlowCreationCfa"

describe("create-cfa-with-entreprise-siret", () => {
  it("test create-cfa-with-entreprise-siret", () => {
    const entrepriseSiret = Cypress.env("ENTREPRISE_AUTOVALIDE_SIRET")

    cy.viewport(1254, 721)

    FlowCreationCfa.siretPage.goTo()
    FlowCreationCfa.siretPage.searchAndSelectSiret(entrepriseSiret)
    FlowCreationCfa.siretPage.submit()
    cy.url().should("contain", "/espace-pro/creation/detail")
    cy.contains("CAISSE NATIONALE DE L'ASSURANC")
  })
})

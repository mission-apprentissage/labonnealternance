import { FlowCreationCfa } from "../pages/FlowCreationCfa"

describe("create-cfa-with-entreprise-siret", () => {
  it("test create-cfa-with-entreprise-siret", () => {
    const entrepriseSiret = Cypress.env("ENTREPRISE_AUTOVALIDE_SIRET")

    cy.viewport(1254, 721)

    FlowCreationCfa.siretPage.goTo()
    FlowCreationCfa.siretPage.fillSiret(entrepriseSiret)
    FlowCreationCfa.siretPage.submit()
    cy.contains("Le numéro siret n'est pas référencé comme centre de formation.")
  })
})

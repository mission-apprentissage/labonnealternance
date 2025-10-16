import { FlowCreationEntreprise } from "../pages/FlowCreationEntreprise"

describe("create-recruiter-account-siret-malformate", () => {
  it("test create-recruiter-account-siret-malformate", () => {
    cy.viewport(1271, 721)

    const siret = "12345678900012"

    FlowCreationEntreprise.siretPage.goTo()
    FlowCreationEntreprise.siretPage.fillSiret(siret)

    cy.contains("Le numéro de SIRET saisi n’est pas valide", { timeout: 10000 }).should("exist")
    cy.get("button[type='submit']", { timeout: 10000 }).should("be.disabled")
  })
})

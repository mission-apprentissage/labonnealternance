import { FlowCreationEntreprise } from "../pages/FlowCreationEntreprise"

describe("create-recruiter-account-siret-inexistent", () => {
  it("test create-recruiter-account-siret-inexistent", () => {
    cy.viewport(1271, 721)

    const siret = "12345678900015"

    FlowCreationEntreprise.siretPage.goTo()
    FlowCreationEntreprise.siretPage.fillSiret(siret)
    FlowCreationEntreprise.siretPage.submit()

    cy.contains("Le numéro siret est invalide.", { timeout: 10000 }).should("exist")
    cy.get("button[type='submit']", { timeout: 10000 }).should("be.disabled")
  })
})

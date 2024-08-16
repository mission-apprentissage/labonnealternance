import { FlowCreationCfa } from "../../pages/FlowCreationCfa"
import { FlowCreationEntreprise } from "../../pages/FlowCreationEntreprise"

describe("create-entreprise-account-siret-cfa", () => {
  it.skip("test create-entreprise-account-siret-cfa", () => {
    cy.viewport(1271, 721)

    const cfaSiret = Cypress.env("CFA_AUTOVALIDE_SIRET")

    FlowCreationEntreprise.siretPage.goTo()
    FlowCreationEntreprise.siretPage.searchAndSelectSiret(cfaSiret)
    FlowCreationEntreprise.siretPage.submit()
    cy.contains("veuillez utiliser ce lien", { timeout: 10000 }).click()

    FlowCreationCfa.siretPage.verify()
  })
})

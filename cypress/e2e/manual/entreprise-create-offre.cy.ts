import { slowCypressDown } from "cypress-slow-down"

import { loginClient } from "../../api/loginClient"
import { FlowCreationEntreprise } from "../../pages/FlowCreationEntreprise"
import { generateRandomString } from "../../utils/generateRandomString"

slowCypressDown(300)

describe("entreprise-create-offre", () => {
  it.skip("test entreprise-create-offre", () => {
    cy.viewport(1271, 721)

    const emailDomain = Cypress.env("ENTREPRISE_AUTOVALIDE_EMAIL_DOMAIN")
    const email = `${generateRandomString()}@${emailDomain}`
    const siret = Cypress.env("ENTREPRISE_AUTOVALIDE_SIRET")
    const firstName = `John-${generateRandomString()}`
    const lastName = `Doe-${generateRandomString()}`

    FlowCreationEntreprise.siretPage.goTo()
    FlowCreationEntreprise.siretPage.fillSiret(siret)
    FlowCreationEntreprise.siretPage.submit()

    FlowCreationEntreprise.personalInfosPage.fillForm({
      firstName,
      lastName,
      phone: "0700000000",
      email,
    })
    FlowCreationEntreprise.personalInfosPage.submit()

    loginClient.login(email)
  })
})

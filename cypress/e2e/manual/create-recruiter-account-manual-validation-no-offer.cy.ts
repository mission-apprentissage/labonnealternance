import { slowCypressDown } from "cypress-slow-down"

import { loginClient } from "../../api/loginClient"
import { FlowCreationEntreprise } from "../../pages/FlowCreationEntreprise"
import { generateRandomString } from "../../utils/generateRandomString"

slowCypressDown(200)

describe("create-recruiter-account-manual-validation-no-offer", () => {
  it.skip("tests create-recruiter-account-manual-validation-no-offer", () => {
    cy.viewport(1271, 721)

    const email = `cypress-manual-validation-${generateRandomString()}@mail.com`
    const siret = Cypress.env("ENTREPRISE_AUTOVALIDE_SIRET")
    const firstName = "John"
    const lastName = "Doe"

    FlowCreationEntreprise.siretPage.goTo()
    FlowCreationEntreprise.siretPage.searchAndSelectSiret(siret)
    FlowCreationEntreprise.siretPage.submit()

    FlowCreationEntreprise.personalInfosPage.fillForm({
      firstName,
      lastName,
      phone: "0700000000",
      email,
    })
    FlowCreationEntreprise.personalInfosPage.submit()
    FlowCreationEntreprise.personalInfosPage.confirmAccountCreation()
    FlowCreationEntreprise.offerPage.assertUrl()
    loginClient.loginAsAdmin()
  })
})

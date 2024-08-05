import { loginClient } from "../api/loginClient"
import { FlowAdminPage } from "../pages/FlowAdminPage"
import { LoginBar } from "../pages/LoginBar"
import { LoginPage } from "../pages/LoginPage"
import { generateRandomString } from "../utils/generateRandomString"

describe("create-opco-account", () => {
  it("create-opco-account", () => {
    cy.viewport(1271, 721)

    const email = `opco-${generateRandomString()}@mail.com`
    const firstname = "opco-firstname"
    const lastname = "opco-lastname"
    const type = "OPCO"
    const opco = "ATLAS"
    const phone = "0612345678"

    loginClient.loginAsAdmin()
    FlowAdminPage.navigation.goToGestionDesAdministrateurs()
    FlowAdminPage.gestionDesAdministrateur.creerNouvelUtilisateur({
      email,
      firstname,
      lastname,
      type,
      opco,
      phone,
    })
    FlowAdminPage.gestionDesAdministrateur.selectAccountWithEmail(email)
    FlowAdminPage.gestionDunAdmin.verifyUserFields({
      email,
      firstname,
      lastname,
      type,
      opco,
      phone,
    })
    LoginBar.disconnect()

    loginClient.login(email)
    LoginBar.expectLoggedAs(firstname, lastname)
    cy.contains("Entreprises")
    LoginBar.disconnect()

    loginClient.loginAsAdmin()
    FlowAdminPage.navigation.goToGestionDesAdministrateurs()
    FlowAdminPage.gestionDesAdministrateur.selectAccountWithEmail(email)
    FlowAdminPage.gestionDunAdmin.deactivate()
    LoginBar.disconnect()

    LoginPage.goTo()
    LoginPage.submitEmail(email)
    cy.contains("Le compte utilisateur est en attente de validation")
  })
})

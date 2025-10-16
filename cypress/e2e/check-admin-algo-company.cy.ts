import { FlowAdminPage } from "../pages/FlowAdminPage"
import { LoginPage } from "../pages/LoginPage"
import { generateRandomString } from "../utils/generateRandomString"

describe("Test connexion admin", () => {
  it("vérifie qu'on ne peut pas accéder aux pages admin sans se connecter", () => {
    LoginPage.verifyNoAuthNoAccess()
  })
  it("vérifie qu'on ne peut pas se connecter avec un email inexistant", () => {
    LoginPage.goTo()
    LoginPage.submitEmail("wrong@wrong.com")
    LoginPage.verifyErrorEmailDoesNotExist()
  })
  it('Vérifie le fonctionnement de la connexion admin"', () => {
    LoginPage.goTo()
    LoginPage.submitEmail(LoginPage.adminEmail)
    LoginPage.verifyEmailOk()
    LoginPage.clickLinkInEmail(LoginPage.adminEmail)

    cy.url().should("contain", "/espace-pro/administration/users")

    const email = `${generateRandomString(10)}@mail.com`
    FlowAdminPage.navigation.goToAlgoCompanyManagement()
    FlowAdminPage.editAlgoCompany.findCompany()
    FlowAdminPage.editAlgoCompany.updateCompanyEmail(email)

    cy.reload()
    FlowAdminPage.navigation.goToAlgoCompanyManagement()
    FlowAdminPage.editAlgoCompany.findCompany()
    FlowAdminPage.editAlgoCompany.verifyEmail(email)
  })
})

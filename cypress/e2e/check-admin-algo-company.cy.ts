import { FlowAdminPage } from "../pages/FlowAdminPage"

describe("Test connexion admin", () => {
  it('Vérifie le fonctionnement de la connexion admin"', () => {
    FlowAdminPage.adminAuth.goTo()
    FlowAdminPage.adminAuth.fillFakeEmail()
    FlowAdminPage.adminAuth.submit()
    FlowAdminPage.adminAuth.verifyWrong()

    FlowAdminPage.adminAuth.fillAdminEmail()
    FlowAdminPage.adminAuth.submit()
    FlowAdminPage.adminAuth.verifyOk()

    FlowAdminPage.adminAuth.clickLinkInEmail()

    cy.url().should("contain", "/espace-pro/administration/users")
  })
})

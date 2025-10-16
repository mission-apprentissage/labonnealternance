import { smtpClient } from "../api/smtpClient"
import { containsText } from "../utils/containText"

export const LoginPage = {
  adminEmail: "admin-recette@beta.gouv.fr",
  verifyErrorEmailDoesNotExist() {
    cy.url().should("contain", "/espace-pro/authentification")
    cy.contains("L’adresse email renseignée n’existe pas", { timeout: 10000 }).should("exist")
  },
  verifyEmailOk() {
    cy.url().should("contain", "/espace-pro/authentification")
    cy.contains("Email valide.", { timeout: 10000 }).should("exist")
  },
  goTo() {
    cy.visit(`${Cypress.env("ui")}/espace-pro/authentification`)
    cy.contains("Vous avez déjà un compte ?", { timeout: 10000 }).should("exist")
  },
  submitEmail(email: string) {
    cy.get("input[name='email']").click()
    cy.get("input[name='email']").clear()
    cy.get("input[name='email']").type(email)
    cy.get("button[type='submit']").click({ timeout: 10000 })
  },
  clickLinkInEmail(email: string) {
    smtpClient.getMail(email, "Lien de connexion").then((emailContent) => {
      containsText("Accéder à mon espace", emailContent)
      const authLink = smtpClient.findUrlInBrackets(`${Cypress.env("ui")}/espace-pro/authentification/verification?token=*`, emailContent)
      cy.visit(authLink)
    })
  },
  verifyNoAuthNoAccess() {
    cy.visit(`${Cypress.env("ui")}/espace-pro/administration/gestionEntreprises`)
    cy.contains("Vous avez déjà un compte ?", { timeout: 10000 }).should("exist")
    cy.url().should("contain", "/espace-pro/authentification")
  },
}

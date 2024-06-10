import { smtpClient } from "../api/smtpClient"
import { containsText } from "../utils/containText"

const ADMIN_EMAIL = "admin-recette@beta.gouv.fr"

export const FlowAdminPage = {
  adminAuth: {
    verifyWrong() {
      cy.url().should("contain", "/espace-pro/authentification")
      cy.contains("L’adresse email renseignée n’existe pas", { timeout: 10000 }).should("exist")
    },
    verifyOk() {
      cy.url().should("contain", "/espace-pro/authentification")
      cy.contains("Email valide.", { timeout: 10000 }).should("exist")
    },
    goTo() {
      cy.visit(`${Cypress.env("ui")}/espace-pro/authentification`)
      cy.contains("Vous avez déjà un compte ?", { timeout: 10000 }).should("exist")
    },
    fillFakeEmail() {
      cy.get("input[name='email']").click()
      cy.get("input[name='email']").clear()
      cy.get("input[name='email']").type("wrong@wrong.com")
    },
    submit() {
      cy.get("button[type='submit']").click({ timeout: 10000 })
    },
    fillAdminEmail() {
      cy.get("input[name='email']").click()
      cy.get("input[name='email']").clear()
      cy.get("input[name='email']").type(ADMIN_EMAIL)
    },
    clickLinkInEmail() {
      smtpClient.getMail(ADMIN_EMAIL, "Lien de connexion").then((emailContent) => {
        containsText("Accéder à mon espace", emailContent)
        const authLink = smtpClient.findUrlInBrackets(`${Cypress.env("ui")}/espace-pro/authentification/verification?token=*`, emailContent)
        cy.visit(authLink)
      })
    },
  },
}

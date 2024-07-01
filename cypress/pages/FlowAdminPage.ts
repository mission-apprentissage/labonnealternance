import { smtpClient } from "../api/smtpClient"
import { containsText } from "../utils/containText"

const ADMIN_EMAIL = "admin-recette@beta.gouv.fr"
const ALGO_COMPANY_SIRET = "11000002300017"

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
    ifNoAuthNoAccess() {
      cy.visit(`${Cypress.env("ui")}/espace-pro/administration/gestionEntreprises`)
      cy.contains("Vous avez déjà un compte ?", { timeout: 10000 }).should("exist")
      cy.url().should("contain", "/espace-pro/authentification")
    },
  },
  navigation: {
    goToAlgoCompanyManagement() {
      cy.get("[data-testid='algo_company_tab']").click()
      cy.contains("SIRET de l'établissement", { timeout: 10000 }).should("exist")
      cy.url().should("contain", "/espace-pro/administration/gestionEntreprises")
    },
  },
  editAlgoCompany: {
    findCompany() {
      cy.get("input[name='siret']").click()
      cy.get("input[name='siret']").clear()
      cy.get("input[name='siret']").type(ALGO_COMPANY_SIRET)
      cy.get("[data-testid='search_for_algo_company']").click()
      cy.contains(`SIRET ${ALGO_COMPANY_SIRET}`, { timeout: 10000 }).should("exist")
      cy.contains("Mise à jour des coordonnées pour l’entreprise", { timeout: 10000 }).should("exist")
    },
    updateCompany() {
      cy.get("input[name='email']").click()
      cy.get("input[name='email']").clear()
      cy.get("[data-testid='update_algo_company']").click()
      cy.get("[data-testid='algo_company_updated_ok']")
    },
  },
}

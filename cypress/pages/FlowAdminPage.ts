const ALGO_COMPANY_SIRET = "11000002300017"

export const FlowAdminPage = {
  navigation: {
    goToAlgoCompanyManagement() {
      cy.get("[data-testid='algo_company_tab']").click({ force: true })
      cy.contains("SIRET de l'établissement", { timeout: 10000 }).should("exist")
      cy.url().should("contain", "/espace-pro/administration/gestionEntreprises")
    },
    goToAccountValidation() {
      cy.get("[data-testid='recruiter_management_tab']").click({ force: true })
      cy.url().should("contain", "/espace-pro/administration/users")
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
    updateCompanyEmail(email: string) {
      cy.get("input[name='email']").click()
      cy.get("input[name='email']").clear()
      cy.get("input[name='email']").type(email)
      cy.get("[data-testid='update_algo_company']").click()
      cy.get("[data-testid='algo_company_updated_ok']")
    },
    verifyEmail(email: string) {
      cy.get("input[name='email']").should("have.value", email)
    },
  },
  gestionDesRecruteurs: {
    fillSearchInput(text: string) {
      cy.get("[data-testid='search-input']").type(text)
    },
    selectTab(tabLabel: string) {
      cy.contains("button", tabLabel).click()
    },
    selectByEmail(email: string) {
      cy.contains("[role='row']", email.toLowerCase()).find("a").first().click()
    },
  },
  pageDunRecruteur: {
    activer() {
      cy.contains("button", "Activer le compte").click()
      cy.contains("Utilisateur validé")
    },
    desactiver(reason: string) {
      cy.contains("button", "Désactiver le compte").click()
      cy.get("[data-testid='confirmation-desactivation-utilisateur-modal']").contains("select", "Sélectionnez un motif").select(reason)
      cy.get("[data-testid='confirmation-desactivation-utilisateur-modal']").contains("button", "Supprimer").click()
      cy.contains("Utilisateur désactivé")
    },
  },
}

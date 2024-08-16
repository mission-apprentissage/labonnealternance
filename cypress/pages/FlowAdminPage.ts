import { LoginBar } from "./LoginBar"

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
    goToGestionDesAdministrateurs() {
      LoginBar.clickLoggedButton()
      cy.contains("Gestion des administrateurs").click()
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
  gestionDesAdministrateur: {
    creerNouvelUtilisateur({
      email,
      firstname,
      lastname,
      type,
      opco,
      phone,
    }: {
      type: "OPCO" | "ADMIN"
      opco?: string
      firstname: string
      lastname: string
      email: string
      phone?: string
    }) {
      cy.contains("Créer un utilisateur").click()
      cy.get("[data-testid='select-type']").select(type)
      if (opco) {
        cy.get("[data-testid='select-opco']").select(opco)
      }
      cy.get("input[name='first_name']").type(firstname)
      cy.get("input[name='last_name']").type(lastname)
      cy.get("input[name='email']").type(email)
      if (phone) {
        cy.get("input[name='phone']").type(phone)
      }
      cy.contains("button", "Créer l'utilisateur").click()
    },
    selectAccountWithEmail(email: string) {
      cy.get("input[data-testid='search-input']").type(email)
      cy.contains("[role='row']", email.toLowerCase()).find("a").first().click()
    },
  },
  gestionDunAdmin: {
    verifyUserFields({
      email,
      firstname,
      lastname,
      type,
      opco,
      phone,
    }: {
      type: "OPCO" | "ADMIN"
      opco?: string
      firstname: string
      lastname: string
      email: string
      phone?: string
    }) {
      cy.get("[data-testid='select-type']").should("have.value", type)
      if (opco) {
        cy.get("[data-testid='select-opco']").should("have.value", opco)
      }
      cy.get("input[name='first_name']").should("have.value", firstname)
      cy.get("input[name='last_name']").should("have.value", lastname)
      cy.get("input[name='email']").should("have.value", email.toLowerCase())
      if (phone) {
        cy.get("input[name='phone']").should("have.value", phone)
      }
    },
    deactivate() {
      cy.contains("button", "Désactiver le compte").click()
      cy.contains("Utilisateur désactivé")
    },
  },
}

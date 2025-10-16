export const FlowCreationCfa = {
  siretPage: {
    verify() {
      cy.url().should("contain", "/espace-pro/creation/cfa")
    },
    goTo() {
      cy.visit(`${Cypress.env("ui")}/espace-pro/creation/cfa`)
      cy.contains("Comment s'inscrire ?", { timeout: 10000 }).should("exist")
    },
    searchAndSelectSiret(siret: string) {
      FlowCreationCfa.siretPage.fillSiret(siret)
      cy.contains(siret).click()
    },
    fillSiret(siret: string) {
      cy.get("input[name='establishment_siret']").click()
      cy.get("input[name='establishment_siret']").type(siret)
    },
    submit() {
      cy.get("button[type='submit']").click({ timeout: 10000 })
    },
  },
  personalInfosPage: {
    fillForm({ email, firstName, lastName, phone }: { firstName: string; lastName: string; email: string; phone: string }) {
      cy.get("input[name='last_name']").click()
      cy.get("input[name='last_name']").type(lastName)
      cy.get("input[name='first_name']").click()
      cy.get("input[name='first_name']").type(firstName)
      cy.get("input[name='phone']").click()
      cy.get("input[name='phone']").type(phone)
      cy.get("input[name='email'").click()
      cy.get("input[name='email'").type(email)
    },
    submit() {
      cy.get("button[type='submit']").click()
    },
  },
  emailSentPage: {
    verify() {
      cy.get("[data-testid='validation-email-title']").should("exist")
    },
  },
}

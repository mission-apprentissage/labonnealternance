export const LoginBar = {
  expectLoggedAs(firstName: string, lastName: string) {
    cy.get("[data-testid='logged-name']").should("include.text", `${firstName} ${lastName}`)
  },
  disconnect() {
    cy.get("[data-testid='logged-button']").click()
    cy.contains("button", "Déconnexion").click()
    cy.contains("Vous avez déjà un compte ?")
  },
}

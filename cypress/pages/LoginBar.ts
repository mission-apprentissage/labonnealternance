export const LoginBar = {
  expectLoggedAs(firstName: string, lastName: string) {
    cy.get("[data-testid='logged-name']").should("include.text", `${firstName} ${lastName}`)
  },
  clickLoggedButton() {
    cy.get("[data-testid='logged-button']").click()
  },
  disconnect() {
    LoginBar.clickLoggedButton()
    cy.contains("button", "Déconnexion").click()
    cy.contains("Vous avez déjà un compte ?")
  },
}

export const LoginBar = {
  expectLoggedAs(firstName: string, lastName: string) {
    cy.get("[data-testid='logged-name']").should("include.text", `${firstName} ${lastName}`)
  },
}

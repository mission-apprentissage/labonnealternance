export const JobPage = {
  goTo(jobId: string) {
    return cy.visit(`${Cypress.env("ui")}/recherche-apprentissage?&type=matcha&itemId=${jobId}`)
  },
  expectNotPublished() {
    cy.get("[data-testid='postuler-button']").should("not.exist")
  },
  expectPublished() {
    cy.get("[data-testid='postuler-button']").should("exist")
  },
}

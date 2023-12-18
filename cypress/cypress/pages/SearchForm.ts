export const SearchForm = {
  goTo() {
    cy.visit(Cypress.env("ui") + "?displayMap=false")
  },
  search({ metier }) {
    cy.get("#headerFormJobField-input").click()
    cy.get("#headerFormJobField-input").type(metier.substring(0, 9))
    cy.get("#headerFormJobField-item-0").click()
    cy.get("#headerFormJobField-input").should("have.value", "Gestion de projets informatiques")
    cy.get("#headerFormPlaceField-input").click()
    cy.get("#headerFormPlaceField-input").type("lill")
    cy.get("#headerFormPlaceField-item-0").click()
    cy.get("[data-testid='widget-form'] select[data-testid='locationRadius']").select("60")
    cy.get("[data-testid='widget-form'] button").click()
  },
}

export const FlowItemDetail = {
  navigation: {
    close() {
      cy.get("[data-testid='close-detail-button']").click()
    },
    goNext() {
      cy.get("[data-testid='next-button']").click()
    },
    goPrevious() {
      cy.get("[data-testid='previous-button']").click()
    },
  },
}

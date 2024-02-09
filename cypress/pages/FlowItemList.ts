export const FlowItemList = {
  lbaCompanies: {
    openFirstWithEmail() {
      cy.get(".resultCard.lba.hasEmail").first().click()
    },
  },
  lbaJobs: {
    openFirst() {
      cy.get(".resultCard.matcha").first().click()
    },
  },
  formations: {
    openFirst() {
      cy.get(".resultCard.training").first().click()
    },
  },
}

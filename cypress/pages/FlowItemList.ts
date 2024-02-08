export const FlowItemList = {
  lbaCompanies: {
    openFirstWithEmail() {
      cy.get(".resultCard.lba.hasEmail").first().click()
    },
  },
}

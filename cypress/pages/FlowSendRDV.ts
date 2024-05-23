export const FlowSendRDV = {
  rdvForm: {
    verifySuccess() {
      cy.get("[data-testid='DemandeDeContactConfirmationTitle']")
    },
    openForm() {
      cy.get("[data-testid='prdvButton']").click()
    },
    fillForm({ email }: { email: string }) {
      cy.get("input[name='firstname']").click()
      cy.get("input[name='firstname']").type("John")
      cy.get("input[name='lastname']").click()
      cy.get("input[name='lastname']").type("Doe")
      cy.get("input[name='phone']").click()
      cy.get("input[name='phone']").type("0700000000")
      cy.get("input[type='email']").click()
      cy.get("input[type='email']").type(email)
      cy.get(".chakra-accordion__button").click()
      cy.get("[data-testid='fieldset-reasons'] input:checkbox[id='reason-3']").click({ force: true })
      cy.get("[data-testid='fieldset-reasons'] input:checkbox[id='reason-11']").click({ force: true })
      cy.get(".chakra-accordion__button").click()
      cy.get("input[name='applicantMessageToCfa']").click()
      cy.get("input[name='applicantMessageToCfa']").type("horaires")
    },
    submit() {
      cy.get("button[type='submit'][data-tracking-id='prendre-rdv-cfa']").click({ timeout: 10000 })
    },
    close() {
      cy.get("button").contains("Fermer").click()
    },
    verifyAlreadyApplied() {
      this.openForm()
      this.verifySuccess()
    },
  },
}

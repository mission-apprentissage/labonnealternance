export const FlowSendApplication = {
  applicationForm: {
    verifySuccess() {
      cy.get("[data-testid='application-success']", { timeout: 20000 })
    },
    openSpontanee() {
      cy.get("[data-testid='CandidatureSpontanee'] button").click()
    },
    fillForm({ file, email }: { file: string; email: string }) {
      cy.get("[data-testid='lastName']").click()
      cy.get("[data-testid='lastName']").type("Doe")
      cy.get("[data-testid='firstName']").click()
      cy.get("[data-testid='firstName']").type("John")
      cy.get("[data-testid='email']").click()
      cy.get("[data-testid='email']").type(email)
      cy.get("[data-testid='phone']").click()
      cy.get("[data-testid='phone']").type("0700000000")
      cy.get("[data-testid='message']").click()
      cy.get("[data-testid='message']").type("Madame, Monsieur,\nEtant actuellement à la recherche d’un emploi, ...")
      cy.get("[data-testid='fileDropzone']").selectFile(file, { action: "drag-drop" })
    },
    submit() {
      cy.get("button[data-testid='candidature-not-sent']").click({ timeout: 20000 })
    },
    close() {
      cy.get("[data-testid='close-application-form']").click()
    },
    verifyAlreadyApplied() {
      cy.get("[data-testid='already-applied']")
    },
  },
}

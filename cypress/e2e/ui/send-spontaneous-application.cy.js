describe("send-spontaneous-application", () => {
  it("tests send-spontaneous-application on " + Cypress.env("ui") + "  ---  " + Cypress.env("server"), () => {
    cy.on("uncaught:exception", () => {
      return false
    })

    cy.intercept("GET", Cypress.env("server") + "/api/v1/jobs?*").as("submitJobCall")
    cy.intercept("POST", Cypress.env("server") + "/api/v1/application").as("submitApplication")

    cy.generateRandomEmail("test-auto-", "@nexistepas.fr", 10).then((randomEmail) => {
      cy.viewport(1254, 704)
      cy.visit(Cypress.env("ui") + "?displayMap=false")
      cy.get("#headerFormJobField-input").click()
      cy.get("#headerFormJobField-input").type("Compta")
      cy.get("#headerFormJobField-item-0").click()
      cy.get("#headerFormJobField-input").should("have.value", "Comptabilité, gestion de paie")
      cy.get("#headerFormPlaceField-input").click()
      cy.get("#headerFormPlaceField-input").type("Marseil")
      cy.get("#headerFormPlaceField-item-0").click()
      cy.get("[data-testid='widget-form'] select[data-testid='diploma']").select("4 (BAC...)")
      cy.get("[data-testid='widget-form'] button").click()

      cy.wait("@submitJobCall").then(() => {
        cy.get(".resultCard.lba.hasEmail").first().click()
        cy.get("[data-testid='CandidatureSpontanee'] button").click()
        cy.get("[data-testid='lastName']").click()
        cy.get("[data-testid='lastName']").type("Doe")
        cy.get("[data-testid='firstName']").click()
        cy.get("[data-testid='firstName']").type("John")
        cy.get("[data-testid='email']").click()
        cy.get("[data-testid='email']").type(randomEmail)
        cy.get("[data-testid='phone']").click()
        cy.get("[data-testid='phone']").type("0700000000")
        cy.get("[data-testid='message']").click()
        cy.get("[data-testid='message']").type("Madame, Monsieur,\nEtant actuellement à la recherche d’un emploi, ...")
        cy.get("[data-testid='fileDropzone']").selectFile("cypress/fixtures/CV - John Doe.pdf", { action: "drag-drop" })
        cy.get("[data-testid='candidature-not-sent']").click()

        cy.wait("@submitApplication").then(() => {
          cy.get("[data-testid='CandidatureSpontaneeWorked']")
        })
      })
    })
  })
})

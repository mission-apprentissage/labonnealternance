describe("send-rdv-from-widget", () => {
  it("tests send-rdv-from-widget on " + Cypress.env("ui") + "  ---  " + Cypress.env("server"), () => {
    cy.intercept("GET", Cypress.env("server") + "/api/v1/formations?*").as("submitTrainingCall")
    cy.intercept("POST", Cypress.env("server") + "/api/appointment-request/validate").as("submitRdv")

    // cy.generateRandomEmail("test-auto-", "@nexistepas.fr", 10).then((randomEmail) => {
    cy.viewport(1254, 704)
    cy.visit(Cypress.env("ui") + "/recherche-apprentissage-formation?displayMap=false")
    cy.get("#headerFormJobField-input").click()
    cy.get("#headerFormJobField-input").type("esth")
    cy.get("#headerFormJobField-item-0").click()
    cy.get("#headerFormJobField-input").should("have.value", "Esthétique")
    cy.get("[data-testid='widget-form'] button").click()

    cy.wait("@submitTrainingCall").then(() => {
      // cy.get(".resultCard.training").first().click()
      // // eslint-disable-next-line cypress/unsafe-to-chain-command
      // cy.get("[data-testid='prdvButton']")
      //   //.invoke("removeAttr", "target")
      //   .click()
      //   .then(() => {
      //     // eslint-disable-next-line cypress/no-unnecessary-waiting
      //     cy.wait(5000).then(() => {
      //       cy.get("input[name='firstname']").click()
      //       cy.get("input[name='firstname']").type("John")
      //       cy.get("input[name='lastname']").click()
      //       cy.get("input[name='lastname']").type("Doe")
      //       cy.get("input[name='phone']").click()
      //       cy.get("input[name='phone']").type("0700000000")
      //       cy.get("input[type='email']").click()
      //       cy.get("input[type='email']").type(randomEmail)
      //       cy.get(".chakra-accordion__button").click()
      //       cy.get("[data-testid='fieldset-reasons'] .chakra-collapse input:checkbox[id='reason-3']").click({ force: true })
      //       cy.get("[data-testid='fieldset-reasons'] .chakra-collapse input:checkbox[id='reason-10']").click({ force: true })
      //       cy.get("input[name='applicantMessageToCfa']").click()
      //       cy.get("input[name='applicantMessageToCfa']").type("horaires")
      //       cy.get("button[type='submit'][data-tracking-id='prendre-rdv-cfa']").click()
      //       cy.wait("@submitRdv").then(() => {
      //         cy.get("[data-testid='DemandeDeContactConfirmationTitle']")
      //       })
      //     })
      //   })
    })
    // })
  })
})

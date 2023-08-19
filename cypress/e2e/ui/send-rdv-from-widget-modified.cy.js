describe("send-rdv-from-widget", () => {
  it("tests send-rdv-from-widget on "+Cypress.env('host'), () => {

    cy.intercept("GET", Cypress.env('host')+"/api/v1/formations?*").as("submitTrainingCall");
    cy.intercept("POST", Cypress.env('host')+"/api/appointment-request/validate").as("submitRdv");

    cy.generateRandomEmail("test-auto-","@nexistepas.fr",10).then((randomEmail) => {
      cy.viewport(1254, 704);
      cy.visit(Cypress.env('host')+"/recherche-apprentissage-formation?displayMap=false");
      cy.get("#headerFormJobField-input").click();
      cy.get("#headerFormJobField-input").type("esth");
      cy.get("#headerFormJobField-item-0").click();
      cy.get("#headerFormJobField-input").should("have.value", "Esthétique")
      cy.get("[data-testid='widget-form'] button").click();

      cy.wait("@submitTrainingCall").then((interception) => {
        cy.get('.resultCard.training').first().click()
        
        cy.get("[data-testid='prdvButton']").invoke("removeAttr", "target").click().then(()=> {
          cy.wait(5000).then( ()=> {
            cy.get("input[name='firstname']").click();
            cy.get("input[name='firstname']").type("John");
            cy.get("input[name='lastname']").click();
            cy.get("input[name='lastname']").type("Doe");
            cy.get("input[name='phone']").click();
            cy.get("input[name='phone']").type("0700000000");
            cy.get("input[type='email']").click();
            cy.get("input[type='email']").type(randomEmail);
            cy.get("label:nth-of-type(2) > span.chakra-checkbox__control").click();
            cy.get("label:nth-of-type(4) > span.chakra-checkbox__control").click();
            cy.get("label:nth-of-type(11) > span.chakra-checkbox__control").click();
            cy.get("input[name='applicantMessageToCfa']").click();
            cy.get("input[name='applicantMessageToCfa']").type("horaires");
            cy.get("button").click();
            cy.wait("@submitRdv").then((rdvResultData) => {
              cy.get("[data-testid='rdv-sent']").get();
            });
          });
        });
      });
    });
  });
});


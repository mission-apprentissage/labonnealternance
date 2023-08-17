describe("send-job-application", () => {
  it("tests send-job-application on "+Cypress.env('host'), () => {

    cy.on('uncaught:exception', (err, runnable) => {
      return false
    })

    cy.intercept("GET", Cypress.env('host')+"/api/v1/jobs?*").as("submitJobCall");
    cy.intercept("POST", Cypress.env('host')+"/api/application").as("submitApplication");

    cy.generateRandomEmail("test-auto-","@nexistepas.fr",10).then((randomEmail) => {
      cy.viewport(1254, 704);
      cy.visit(Cypress.env('host')+"?displayMap=false");
      cy.get("#headerFormJobField-input").click();
      cy.get("#headerFormJobField-input").type("ress");
      cy.get("#headerFormJobField-item-0").click();
      cy.get("#headerFormJobField-input").should("have.value", "Ressources humaines")
      cy.get("#headerFormPlaceField-input").click();
      cy.get("#headerFormPlaceField-input").type("pari");
      cy.get("#headerFormPlaceField-item-0").click();
      cy.get("[data-testid='widget-form'] select[data-testid='locationRadius']").select("60");
      cy.get("[data-testid='widget-form'] button").click();
      
      cy.wait("@submitJobCall").then((interception) => {
        cy.get("[data-testid='matcha6480a61b8ee143d3eff357a6']").click();
        cy.get("[data-testid='CandidatureSpontanee'] button").click();
        cy.get("[data-testid='lastName']").click();
        cy.get("[data-testid='lastName']").type("Doe");
        cy.get("[data-testid='firstName']").click();
        cy.get("[data-testid='firstName']").type("John");
        cy.get("[data-testid='email']").click();
        cy.get("[data-testid='email']").type(randomEmail);
        cy.get("[data-testid='phone']").click();
        cy.get("[data-testid='phone']").type("0700000000");
        cy.get("[data-testid='message']").click();
        cy.get("[data-testid='message']").type("Madame, Monsieur,\nEtant actuellement à la recherche d’un emploi, ...");
        cy.get("[data-testid='fileDropzone']").selectFile("cypress/fixtures/CV - John Doe.docx", { action: "drag-drop" });
        cy.get("[data-testid='candidature-not-sent']").click();
        
        cy.wait("@submitApplication").then((applicationResultData) => {
          cy.get("[data-testid='CandidatureSpontaneeWorked']");          
        });
      });
      
      

    });
  });
});

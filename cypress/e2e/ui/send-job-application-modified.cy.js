describe("send-job-application", () => {
  it("tests send-job-application on "+Cypress.env('host'), () => {

    cy.on('uncaught:exception', (err, runnable) => {
      return false
    })

    cy.intercept("GET", Cypress.env('host')+"/api/v1/jobs?*").as("submitJobCall");

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
        cy.get("[data-testid='message']").type("Madame, Monsieur,\nEtant actuellement à la recherche d’un emploi, je me permets de vous proposer ma candidature au poste de (emploi).\n\nEn effet, mon profil correspond à la description recherchée sur l’offre d’emploi (préciser où l’annonce a été vue). (Si le candidat possède peu d’expérience professionnelle) Ma formation en (préciser la formation) m'a permis d'acquérir de nombreuses compétences parmi celles que vous recherchez. Je possède tous les atouts qui me permettront de réussir dans le rôle que vous voudrez bien me confier. Motivation, rigueur et écoute sont les maîtres mots de mon comportement professionnel.(Si le candidat possède une expérience significative dans le poste à pourvoir). Mon expérience en tant que (emploi) m’a permis d’acquérir toutes les connaissances nécessaires à la bonne exécution des tâches du poste à pourvoir. Régulièrement confronté aux aléas du métier, je suis capable de répondre aux imprévus en toute autonomie. Intégrer votre entreprise représente pour moi un réel enjeu d’avenir dans lequel mon travail et mon honnêteté pourront s’exprimer pleinement.\n\nRestant à votre disposition pour toute information complémentaire, je suis disponible pour vous rencontrer lors d’un entretien à votre convenance\n\nVeuillez agréer, Madame, Monsieur, l’expression de mes sincères salutations.");
        cy.get("[data-testid='fileDropzone']").selectFile("cypress/fixtures/CV - John Doe.docx", { action: "drag-drop" });
        cy.get("[data-testid='candidature-not-sent']").click();
      });
      
      

    });
  });
});

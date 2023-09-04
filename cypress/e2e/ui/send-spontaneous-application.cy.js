describe("send-spontaneous-application", () => {
  it("tests send-spontaneous-application", () => {
    cy.viewport(1254, 704);
    cy.visit("https://labonnealternance-recette.apprentissage.beta.gouv.fr/");
    cy.get("form > div > div.css-0 input").click();
    cy.get("form > div > div.css-0 input").type("C");
    cy.get("form > div > div.css-0 input").type("Compta");
    cy.get("#lang-switcher-item-0").click();
    cy.get("div.css-1kw2fa0 input").click();
    cy.get("div.css-1kw2fa0 input").type("Marseil");
    cy.get("#lang-switcher-item-0 > strong").click();
    cy.get("div.css-6st093 div:nth-of-type(4) select").click();
    cy.get("div.css-6st093 div:nth-of-type(4) select").type("4 (BAC...)");
    cy.get("div.css-uos98o img").click();
    cy.get("[data-testid='lba80781306800036'] div.css-17xle36").click();
    cy.get("[data-testid='CandidatureSpontanee'] button").click();
    cy.get("[data-testid='lastName']").click();
    cy.get("[data-testid='lastName']").type("Doe");
    cy.get("[data-testid='firstName']").type("John");
    cy.get("[data-testid='email']").rightclick();
    cy.get("[data-testid='email']").type("test-auto@nexistepas.fr");
    cy.get("[data-testid='phone']").click();
    cy.get("[data-testid='phone']").type("0700000000");
    cy.get("p.css-1egmowt").click();
    cy.get("[data-testid='fileDropzone']").type("C:\\fakepath\\CV - John Doe.docx");
    cy.get("[data-testid='candidature-not-sent']").click();
    cy.get("div:nth-of-type(4) h2").click();
  });
});
//# recorderSourceMap=BCBDBEAEAEAEAEAEBFBGAGBHBIBJBKBLBMBNBOBPAPBQAQBRBSASASBTATATBUBVBWBXBYBZBaAaB

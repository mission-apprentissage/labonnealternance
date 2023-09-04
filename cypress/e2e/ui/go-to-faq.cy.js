describe("go-to-faq", () => {
  it("tests go-to-faq", () => {
    cy.viewport(1510, 1304);
    cy.visit("https://labonnealternance.apprentissage.beta.gouv.fr/");
    cy.get("li:nth-of-type(5) > a").click();
  });
});
//# recorderSourceMap=BCBDBEBFA

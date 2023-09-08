describe("test", () => {
  it("tests test", () => {
    cy.viewport(1220, 1304)
    cy.visit("https://labonnealternance.apprentissage.beta.gouv.fr/")
    cy.get("li:nth-of-type(8) > a").click()
  })
})
//# recorderSourceMap=BCBDBEBFA

describe("go-to-propos", () => {
  it("should go to propos page", () => {
    cy.viewport(1220, 1304)
    cy.visit("https://labonnealternance.apprentissage.beta.gouv.fr/")
    cy.get("li:nth-of-type(8) > a").click()
  })
})
//# recorderSourceMap=BCBDBEBFA

describe("go-to-faq", () => {
  it("go to FAQ page", () => {
    cy.viewport(1510, 1304)
    cy.visit("https://labonnealternance.apprentissage.beta.gouv.fr/")
    cy.get("li:nth-of-type(5) > a").click()
  })
})

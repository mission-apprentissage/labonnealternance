describe("go-to-faq", () => {
  it("tests go-to-faq", () => {
    cy.visit("https://labonnealternance-recette.apprentissage.beta.gouv.fr/")
    cy.get("li:nth-of-type(5) > a").click()
    cy.get("h1").children().first().should("have.text", "Questions")
  })
})

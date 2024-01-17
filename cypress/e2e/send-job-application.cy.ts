import { smtpClient } from "../api/smtpClient"
import { SearchForm } from "../pages/SearchForm"
import { generateRandomString } from "../utils/generateRandomEmail"

describe("send-job-application", () => {
  it("tests send-job-application", () => {
    cy.on("uncaught:exception", () => {
      return false
    })

    cy.intercept("GET", Cypress.env("server") + "/api/v1/jobs?*").as("submitJobCall")
    cy.intercept("POST", Cypress.env("server") + "/api/v1/application").as("submitApplication")

    const randomEmail = `test-auto-${generateRandomString()}@nexistepas.fr`
    cy.viewport(1254, 704)
    SearchForm.goToHome()
    SearchForm.fillSearch({
      metier: "Gestion de projets informatiques",
      location: "Lille 59160",
      distance: 60,
    })
    SearchForm.submit()

    cy.wait("@submitJobCall").then(() => {
      cy.get(".resultCard.matcha").first().click()
      cy.get("[data-testid='CandidatureSpontanee'] button").click()
      cy.get("[data-testid='lastName']").click()
      cy.get("[data-testid='lastName']").type("Doe")
      cy.get("[data-testid='firstName']").click()
      cy.get("[data-testid='firstName']").type("John")
      cy.get("[data-testid='email']").click()
      cy.get("[data-testid='email']").type(randomEmail)
      cy.get("[data-testid='phone']").click()
      cy.get("[data-testid='phone']").type("0700000000")
      cy.get("[data-testid='message']").click()
      cy.get("[data-testid='message']").type("Madame, Monsieur,\nEtant actuellement à la recherche d’un emploi, ...")
      cy.get("[data-testid='fileDropzone']").selectFile("cypress/fixtures/CV - John Doe.docx", { action: "drag-drop" })
      cy.get("[data-testid='candidature-not-sent']").click()
      cy.wait("@submitApplication").then(() => {
        cy.get("[data-testid='CandidatureSpontaneeWorked']")
        return smtpClient.getMail(randomEmail, "Votre candidature chez")
      })
    })
  })
})

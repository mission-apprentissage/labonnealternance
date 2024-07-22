import { slowCypressDown } from "cypress-slow-down"

import { FlowItemList } from "../pages/FlowItemList"
import { FlowSendApplication } from "../pages/FlowSendApplication"
import { givenAMatchaOffer } from "../pages/givenAMatchaOffer"
import { SearchForm } from "../pages/SearchForm"
import { generateRandomString } from "../utils/generateRandomString"

slowCypressDown(300)

describe("send-job-application", () => {
  it("tests send-job-application", () => {
    cy.on("uncaught:exception", () => {
      return false
    })

    const fakeMail = `${generateRandomString()}@beta.gouv.fr`

    cy.viewport(1254, 704)

    givenAMatchaOffer()

    SearchForm.goToHome()
    SearchForm.fillSearch({
      metier: "Exploitation agricole",
      location: "Roubaix 59100",
      distance: 60,
    })
    SearchForm.submit()
    SearchForm.uncheckFormations()

    FlowItemList.lbaJobs.openFirst()

    FlowSendApplication.applicationForm.openSpontanee()
    FlowSendApplication.applicationForm.fillForm({ file: "cypress/fixtures/CV - John Doe.pdf", email: fakeMail })
    FlowSendApplication.applicationForm.submit()
    FlowSendApplication.applicationForm.verifySuccess()
    FlowSendApplication.applicationForm.close()
    FlowSendApplication.applicationForm.verifyAlreadyApplied()

    // désactivé à cause du process asynchrone
    // smtpClient.getMail(fakeMail, "Votre candidature chez").then((emailContent) => {
    //   containsText("Votre candidature a bien été envoyée à", emailContent)
    //   const offreUrl = smtpClient.findUrlInBrackets(`${Cypress.env("ui")}/recherche-apprentissage?*`, emailContent)
    //   cy.visit(offreUrl)
    //   FlowSendApplication.applicationForm.verifyAlreadyApplied()
    // })
  })
})

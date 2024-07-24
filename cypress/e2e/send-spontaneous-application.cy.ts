import { slowCypressDown } from "cypress-slow-down"

import { FlowItemList } from "../pages/FlowItemList"
import { FlowSendApplication } from "../pages/FlowSendApplication"
import { SearchForm } from "../pages/SearchForm"
import { generateRandomString } from "../utils/generateRandomString"

slowCypressDown(300)

describe("send-spontaneous-application", () => {
  it("tests send-spontaneous-application", () => {
    cy.on("uncaught:exception", () => {
      return false
    })

    const fakeMail = `${generateRandomString()}@beta.gouv.fr`

    cy.viewport(1254, 704)

    SearchForm.goToHome()
    SearchForm.fillSearch({
      metier: "Comptabilité, gestion de paie",
      location: "Marseille",
      niveauEtude: "4 (BAC...)",
    })
    SearchForm.submit()

    FlowItemList.lbaCompanies.openFirstWithEmail()
    FlowSendApplication.applicationForm.openSpontanee()
    FlowSendApplication.applicationForm.fillForm({ file: "cypress/fixtures/CV - John Doe.pdf", email: fakeMail })
    FlowSendApplication.applicationForm.submit()
    FlowSendApplication.applicationForm.verifySuccess()
    FlowSendApplication.applicationForm.close()
    FlowSendApplication.applicationForm.verifyAlreadyApplied()

    // désactivé à cause du process asynchrone
    // smtpClient.getMail(fakeMail, "Votre candidature chez").then((emailContent) => {
    //   containsText("Votre candidature a bien été envoyée à", emailContent)
    // })
  })
})

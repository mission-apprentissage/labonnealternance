import { slowCypressDown } from "cypress-slow-down"

import { smtpClient } from "../api/smtpClient"
import { FlowItemList } from "../pages/FlowItemList"
import { FlowSendRDV } from "../pages/FlowSendRDV"
import { SearchForm } from "../pages/SearchForm"
import { containsText } from "../utils/containText"
import { generateRandomString } from "../utils/generateRandomString"

slowCypressDown(300)

describe("send-rdv-from-training", () => {
  it("test send-rdv-from-training", () => {
    cy.on("uncaught:exception", () => {
      return false
    })

    const fakeMail = `${generateRandomString()}@beta.gouv.fr`

    cy.viewport(1254, 704)
    SearchForm.goToSearchFormation()
    SearchForm.fillSearch({
      metier: "Esthétique",
      location: "Bordeaux 33000",
    })
    SearchForm.submit()

    FlowItemList.formations.openFirst()

    FlowSendRDV.rdvForm.openForm()
    FlowSendRDV.rdvForm.fillForm({ email: fakeMail })
    FlowSendRDV.rdvForm.submit()
    FlowSendRDV.rdvForm.verifySuccess()
    FlowSendRDV.rdvForm.close()
    FlowSendRDV.rdvForm.verifyAlreadyApplied()
    FlowSendRDV.rdvForm.close()
    FlowSendRDV.rdvForm.verifyNoDoubleApply({ email: fakeMail })

    smtpClient.getMail(fakeMail, "Votre demande de RDV").then((emailContent) => {
      containsText("Merci de votre intérêt pour la formation", emailContent)
    })
  })
})

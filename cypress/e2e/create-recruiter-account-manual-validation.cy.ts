import { smtpClient } from "../api/smtpClient"
import { FlowCreationEntreprise } from "../pages/FlowCreationEntreprise"
import { generateRandomString } from "../utils/generateRandomString"

describe("create-recruiter-account-siret-inexistent", () => {
  it("tests create-recruiter-account-siret-inexistent", () => {
    cy.viewport(1271, 721)

    const email = `cypress-manual-validation-${generateRandomString()}@mail.com`
    const siret = Cypress.env("ENTREPRISE_AUTOVALIDE_SIRET")
    const firstName = "John"
    const lastName = "Doe"
    const romeLabel = "Adjoint / Adjointe au responsable des ressources humaines"
    const studyLevel = "Indifférent"

    FlowCreationEntreprise.siretPage.goTo()
    FlowCreationEntreprise.siretPage.fillSiret(siret)
    FlowCreationEntreprise.siretPage.submit()

    FlowCreationEntreprise.personalInfosPage.fillForm({
      firstName,
      lastName,
      phone: "0700000000",
      email,
    })
    FlowCreationEntreprise.personalInfosPage.submit()
    FlowCreationEntreprise.personalInfosPage.confirmAccountCreation()
    FlowCreationEntreprise.offerPage.assertUrl()
    FlowCreationEntreprise.offerPage.fillForm({
      romeLabel,
      contractType: {
        Professionnalisation: true,
      },
      studyLevel,
      startDate: "2028-12-23",
      isDisabledElligible: true,
      jobCount: 6,
      jobDurationInMonths: 12,
    })
    FlowCreationEntreprise.offerPage.submit()
    FlowCreationEntreprise.delegationPage.selectCFAs(["SAS L'ACADEMIE DE MANAGEMENT"])
    FlowCreationEntreprise.delegationPage.submit()
    FlowCreationEntreprise.emailSentPage.verify([email.toLowerCase(), romeLabel, studyLevel])
    FlowCreationEntreprise.emailSentPage.goBackHome()
    smtpClient.getMail(email, "Confirmez votre adresse mail")
  })
})

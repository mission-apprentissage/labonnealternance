import { FlowCreationEntreprise } from "../pages/FlowCreationEntreprise"
import { generateRandomString } from "../utils/generateRandomString"

describe("create-recruiter-account-siret-inexistent", () => {
  it("test create-recruiter-account-siret-inexistent", () => {
    cy.viewport(1271, 721)

    const emailDomain = Cypress.env("ENTREPRISE_AUTOVALIDE_EMAIL_DOMAIN")
    const email = `${generateRandomString()}@${emailDomain}`
    const siret = Cypress.env("ENTREPRISE_AUTOVALIDE_SIRET")
    const firstName = "John"
    const lastName = "Doe"
    const romeLabel = "Net surfeur / Net surfeuse"
    const studyLevel = "Cap, autres formations niveau (Infrabac)"

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
    FlowCreationEntreprise.delegationPage.selectCFAs(["UNIVERSITE GRENOBLE ALPES"])
    FlowCreationEntreprise.delegationPage.submit()
    FlowCreationEntreprise.emailSentPage.verify([email.toLowerCase(), romeLabel, studyLevel])
    FlowCreationEntreprise.emailSentPage.goBackHome()
  })
})

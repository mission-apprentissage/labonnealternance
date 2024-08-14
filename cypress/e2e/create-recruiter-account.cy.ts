import { slowCypressDown } from "cypress-slow-down"

import { smtpClient } from "../api/smtpClient"
import { FlowCreationEntreprise } from "../pages/FlowCreationEntreprise"
import { JobPage } from "../pages/JobPage"
import { LoginBar } from "../pages/LoginBar"
import { generateRandomString } from "../utils/generateRandomString"

slowCypressDown(300)

describe("create-recruiter-account", () => {
  it("test create-recruiter-account", () => {
    cy.viewport(1271, 721)

    const emailDomain = Cypress.env("ENTREPRISE_AUTOVALIDE_EMAIL_DOMAIN")
    const email = `${generateRandomString()}@${emailDomain}`
    const siret = Cypress.env("ENTREPRISE_AUTOVALIDE_SIRET")
    const firstName = `John-${generateRandomString()}`
    const lastName = `Doe-${generateRandomString()}`
    const romeLabel = "Net surfeur / Net surfeuse"
    const studyLevel = "Cap, autres formations niveau (Infrabac)"

    FlowCreationEntreprise.siretPage.goTo()
    FlowCreationEntreprise.siretPage.searchAndSelectSiret(siret)
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
    FlowCreationEntreprise.emailSentPage.verify([email.toLowerCase()])
    FlowCreationEntreprise.emailSentPage.getJobId().then((jobId) => {
      FlowCreationEntreprise.emailSentPage.goBackHome()

      // verifie que l'offre est visible
      JobPage.goTo(jobId)
      cy.contains(romeLabel)
      JobPage.expectPublished()

      // vérifie que le recruteur peut se connecter
      smtpClient.getMail(email, "Confirmez votre adresse mail").then((mailContent) => {
        const url = smtpClient.findUrlInBrackets(`${Cypress.env("ui")}/espace-pro/authentification/validation/*`, mailContent)
        cy.visit(url)
        cy.url().should("contain", "/espace-pro/administration/entreprise/")
        LoginBar.expectLoggedAs(firstName, lastName)
      })
    })
  })
})

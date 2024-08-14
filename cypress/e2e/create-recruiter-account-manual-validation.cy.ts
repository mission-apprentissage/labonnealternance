import { slowCypressDown } from "cypress-slow-down"

import { loginClient } from "../api/loginClient"
import { smtpClient } from "../api/smtpClient"
import { FlowAdminPage } from "../pages/FlowAdminPage"
import { FlowCreationEntreprise } from "../pages/FlowCreationEntreprise"
import { JobPage } from "../pages/JobPage"
import { LoginBar } from "../pages/LoginBar"
import { LoginPage } from "../pages/LoginPage"
import { generateRandomString } from "../utils/generateRandomString"

slowCypressDown(200)

describe("create-recruiter-account-manual-validation", () => {
  it("tests create-recruiter-account-manual-validation", () => {
    cy.viewport(1271, 721)

    const email = `cypress-manual-validation-${generateRandomString()}@mail.com`
    const siret = Cypress.env("ENTREPRISE_AUTOVALIDE_SIRET")
    const firstName = "John"
    const lastName = "Doe"
    const romeLabel = "Adjoint / Adjointe au responsable des ressources humaines"
    const studyLevel = "Indifférent"

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
    FlowCreationEntreprise.emailSentPage.verify([email.toLowerCase()])
    FlowCreationEntreprise.emailSentPage.getJobId().then((jobId) => {
      FlowCreationEntreprise.emailSentPage.goBackHome()
      // verifie que l'offre n'est pas visible
      JobPage.goTo(jobId)
      JobPage.expectNotPublished()

      smtpClient.getMail(email, "Confirmez votre adresse mail").then((mailContent) => {
        // confirmation de l'email
        const url = smtpClient.findUrlInBrackets(`${Cypress.env("ui")}/espace-pro/authentification/validation/*`, mailContent)
        cy.visit(url)
        cy.contains("Merci ! Votre adresse email est bien confirmée.")
        cy.url().should("contain", "/authentification/validation/")

        // vérifie que le recruteur ne peut pas se connecter
        loginClient.expectLoginFail(email, "VALIDATION")

        loginClient.loginAsAdmin()
        FlowAdminPage.navigation.goToAccountValidation()
        FlowAdminPage.gestionDesRecruteurs.selectTab("En attente de vérification")
        FlowAdminPage.gestionDesRecruteurs.fillSearchInput(email)
        FlowAdminPage.gestionDesRecruteurs.selectByEmail(email)
        FlowAdminPage.pageDunRecruteur.activer()
        LoginBar.disconnect()

        LoginPage.goTo()
        LoginPage.submitEmail(email)
        LoginPage.clickLinkInEmail(email)
        LoginBar.disconnect()

        JobPage.goTo(jobId)
        JobPage.expectPublished()

        loginClient.loginAsAdmin()
        FlowAdminPage.navigation.goToAccountValidation()
        FlowAdminPage.gestionDesRecruteurs.selectTab("Actifs")
        FlowAdminPage.gestionDesRecruteurs.fillSearchInput(email)
        FlowAdminPage.gestionDesRecruteurs.selectByEmail(email)
        FlowAdminPage.pageDunRecruteur.desactiver("Injoignable")
        LoginBar.disconnect()

        LoginPage.goTo()
        LoginPage.submitEmail(email)
        cy.contains("Le compte utilisateur est en attente de validation")

        smtpClient.getMail(email, "Votre compte a été désactivé sur La bonne alternance")
      })
    })
  })
})

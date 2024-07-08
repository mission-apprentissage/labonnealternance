import { smtpClient } from "../../api/smtpClient"
import { FlowCreationCfa } from "../../pages/FlowCreationCfa"
import { LoginBar } from "../../pages/LoginBar"
import { generateRandomString } from "../../utils/generateRandomString"

describe("create-cfa-account-autovalidated", () => {
  it("test create-cfa-account-autovalidated", () => {
    const cfaEmail = `${generateRandomString()}@${Cypress.env("CFA_AUTOVALIDE_EMAIL_DOMAIN")}`
    const cfaSiret = Cypress.env("CFA_AUTOVALIDE_SIRET")
    const firstName = "John"
    const lastName = "Doe"

    cy.viewport(1254, 721)

    // cy.deleteMany({ cfa_delegated_siret: cfaSiret }, { collection: "recruiters" })
    // cy.deleteMany({ establishment_siret: cfaSiret }, { collection: "userrecruteurs" })

    FlowCreationCfa.siretPage.goTo()
    FlowCreationCfa.siretPage.fillSiret(cfaSiret)
    FlowCreationCfa.siretPage.submit()

    FlowCreationCfa.personalInfosPage.fillForm({
      firstName,
      lastName,
      phone: "0700000000",
      email: cfaEmail,
    })
    FlowCreationCfa.personalInfosPage.submit()
    FlowCreationCfa.emailSentPage.verify()

    smtpClient.getMail(cfaEmail, "Confirmez votre adresse mail").then((emailContent) => {
      const validationUrl = smtpClient.findUrlInBrackets(`${Cypress.env("ui")}/espace-pro/authentification/validation/*?token=*`, emailContent)
      cy.visit(validationUrl)
      LoginBar.expectLoggedAs(firstName, lastName)
      cy.get("[datatest-id='header-ajouter-entreprise']").should("include.text", "Ajoutez votre première entreprise partenaire")
    })
  })
})

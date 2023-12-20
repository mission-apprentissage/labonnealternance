import { smtpClient } from "../api/smtpClient"
import { FlowCreationCfa } from "../pages/FlowCreationCfa"
import { LoginBar } from "../pages/LoginBar"

describe("create-cfa-account-autovalidated", () => {
  it("tests create-cfa-account-autovalidated", () => {
    const cfaEmail = Cypress.env("CFA_AUTOVALIDE_EMAIL") || Cypress.env("cfa")?.autovalide?.email
    const cfaSiret = Cypress.env("CFA_AUTOVALIDE_SIRET") || Cypress.env("cfa")?.autovalide?.siret
    const firstName = "John"
    const lastName = "Doe"

    cy.viewport(1254, 721)

    cy.deleteMany({ cfa_delegated_siret: cfaSiret }, { collection: "recruiters" })
    cy.deleteMany({ establishment_siret: cfaSiret }, { collection: "userrecruteurs" })

    FlowCreationCfa.page1.goTo()
    FlowCreationCfa.page1.fillSiret(cfaSiret)
    FlowCreationCfa.page1.submit()

    FlowCreationCfa.page2.fillForm({
      firstName,
      lastName,
      phone: "0700000000",
      email: cfaEmail,
    })
    FlowCreationCfa.page2.submit()

    smtpClient.getMail(cfaEmail, "Confirmez votre adresse mail").then((emailContent) => {
      const validationUrl = smtpClient.findUrlInBrackets(`${Cypress.env("ui")}/espace-pro/authentification/validation/*?token=*`, emailContent)
      cy.visit(validationUrl)
      LoginBar.expectLoggedAs(firstName, lastName)
      cy.get("[datatest-id='header-ajouter-entreprise']").should("include.text", "Ajoutez votre première entreprise partenaire")
    })
  })
})
//# recorderSourceMap=BCBDBEBFBGBHBIBJBKBLBMBNBOBPBQA

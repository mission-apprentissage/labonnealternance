import { smtpClient } from "./smtpClient"

export const loginClient = {
  loginAsAdmin() {
    return this.login("admin-recette@beta.gouv.fr").then(() => {
      cy.contains("Gestion des recruteurs")
    })
  },
  login(email: string) {
    return cy
      .request("POST", `${Cypress.env("server")}/api/login/magiclink`, { email })
      .then(() => {
        return smtpClient.getMail(email, "Lien de connexion")
      })
      .then((mailContent) => {
        const url = new RegExp("(http[^ ]+token=[a-zA-Z0-9.\\-_]+)", "g").exec(mailContent)[1]
        if (!url) {
          throw new Error("could not find url")
        }
        cy.visit(url)
      })
  },
  expectLoginFail(email: string, reason: string) {
    cy.request({
      method: "POST",
      url: `${Cypress.env("server")}/api/login/magiclink`,
      body: { email },
      failOnStatusCode: false,
    }).then((response) => {
      if (response.body.reason !== reason) {
        throw new Error(`expected reason=${reason} but got login query response=${JSON.stringify({ status: response.status, body: response.body })}`)
      }
    })
  },
}

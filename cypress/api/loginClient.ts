import { smtpClient } from "./smtpClient"

export const loginClient = {
  login(email: string) {
    cy.request("POST", `${Cypress.env("server")}/api/login/magiclink`, { email })
      .then(() => {
        return smtpClient.getMail(email, "Lien de connexion")
      })
      .then((mailContent) => {
        const url = new RegExp("(http[^ ]+token=[a-zA-Z0-9.-]+)", "g").exec(mailContent)?.at(1)
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

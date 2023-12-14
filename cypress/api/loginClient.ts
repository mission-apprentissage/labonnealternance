import { smtpClient } from "./smtpClient"

export const loginClient = {
  async login(email: string) {
    cy.request("POST", `${Cypress.env("server")}/api/login/magiclink`, { email })
      .then(() => {
        return smtpClient.getMail(email, "Lien de connexion")
      })
      .then((mailContent) => {
        const token = new RegExp("token=([a-zA-Z0-9.-]*)", "g").exec(mailContent)[1]
        return token
      })
  },
}

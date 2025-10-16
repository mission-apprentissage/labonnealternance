import { loginClient } from "../../api/loginClient"

describe("login-admin", () => {
  it.skip("login-admin", () => {
    cy.viewport(1271, 721)

    loginClient.loginAsAdmin()
  })
})

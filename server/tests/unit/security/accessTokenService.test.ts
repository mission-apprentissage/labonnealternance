import { zRoutes } from "shared/routes"
import { describe, expect, it } from "vitest"

import { generateAccessToken, parseAccessToken } from "../../../src/security/accessTokenService"

describe("accessTokenService", () => {
  // called route
  const user = { type: "cfa" as const, email: "plop@gmail.com", siret: "12343154300012" }
  const schema = zRoutes.get["/admin/etablissements/siret-formateur/:siret"]
  const options = {
    params: {
      siret: "12343154300012",
    },
    querystring: undefined,
  }
  const expectTokenValid = (token: string) => expect(parseAccessToken(token, schema, options.params, options.querystring)).toBeTruthy()
  const expectTokenInvalid = (token: string) => expect(() => parseAccessToken(token, schema, options.params, options.querystring)).toThrow()

  describe("valid tokens", () => {
    it("should generate a token valid for a specific route", () => {
      const token = generateAccessToken(user, [
        {
          schema,
          resources: {},
          options,
        },
      ])
      expectTokenValid(token)
    })
    it("should generate a token valid for a generic route", () => {
      const token = generateAccessToken(user, [
        {
          schema,
          resources: {},
          options: "all",
        },
      ])
      expectTokenValid(token)
    })
  })
  describe("invalid tokens", () => {
    it("should detect an invalid token that has a different param", () => {
      const token = generateAccessToken(user, [
        {
          schema,
          resources: {},
          options: {
            params: {
              siret: "not the right siret",
            },
            querystring: undefined,
          },
        },
      ])
      expectTokenInvalid(token)
    })
    it("should detect an invalid token that is for a different route", () => {
      const token = generateAccessToken(user, [
        {
          schema: zRoutes.post["/admin/users"],
          resources: {},
          options: "all",
        },
      ])
      expectTokenInvalid(token)
    })
  })
})

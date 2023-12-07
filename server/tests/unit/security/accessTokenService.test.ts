import { z } from "shared/helpers/zodWithOpenApi"
import { zRoutes } from "shared/routes"
import { describe, expect, it } from "vitest"

import { SchemaWithSecurity, generateAccessToken, generateScope, parseAccessToken } from "../../../src/security/accessTokenService"

describe("accessTokenService", () => {
  // called route
  const user = { type: "cfa" as const, email: "plop@gmail.com", siret: "12343154300012" }
  const schema = {
    method: "post",
    path: "path/:id",
    params: z.object({
      id: z.string(),
    }),
    querystring: z.object({
      establishment_siret: z.string(),
      skip: z.string().optional(),
    }),
    securityScheme: {
      auth: "access-token",
      access: "user:manage",
      resources: {},
    },
  } as const satisfies SchemaWithSecurity
  const options = {
    params: {
      id: "123456",
    },
    querystring: {
      establishment_siret: "12343154300012",
      skip: "3",
    },
  } as const
  const expectTokenValid = (token: string) => expect(parseAccessToken(token, schema, options.params, options.querystring)).toBeTruthy()
  const expectTokenInvalid = (token: string) => expect(() => parseAccessToken(token, schema, options.params, options.querystring)).toThrow()

  describe("valid tokens", () => {
    it("should generate a token valid for a specific route", () => {
      const token = generateAccessToken(user, [
        generateScope({
          schema,
          options,
        }),
      ])
      expectTokenValid(token)
    })
    it("should generate a token valid for a specific param and allow all querystring", () => {
      const token = generateAccessToken(user, [
        generateScope({
          schema,
          options: {
            params: {
              id: "123456",
            },
            querystring: {
              establishment_siret: { allowAll: true },
              skip: { allowAll: true },
            },
          },
        }),
      ])
      expectTokenValid(token)
    })
    it("should generate a token valid for a generic route", () => {
      const token = generateAccessToken(user, [
        generateScope({
          schema,
          options: "all",
        }),
      ])
      expectTokenValid(token)
    })
  })
  describe("invalid tokens", () => {
    it("should detect an invalid token that has a different param", () => {
      const token = generateAccessToken(user, [
        generateScope({
          schema,
          options: {
            params: {
              ...options.params,
              id: "other param value",
            },
            querystring: options.querystring,
          },
        }),
      ])
      expectTokenInvalid(token)
    })
    it("should detect an invalid token that has a different querystring", () => {
      const token = generateAccessToken(user, [
        generateScope({
          schema,
          options: {
            params: options.params,
            querystring: {
              ...options.querystring,
              establishment_siret: "not the right siret",
            },
          },
        }),
      ])
      expectTokenInvalid(token)
    })
    it("should detect an invalid token that is for a different route", () => {
      const token = generateAccessToken(user, [
        generateScope({
          schema: zRoutes.post["/admin/users"],
          options: "all",
        }),
      ])
      expectTokenInvalid(token)
    })
    it("should detect an invalid token that has an allowAll but not for all querystrings", () => {
      const token = generateAccessToken(user, [
        generateScope({
          schema,
          options: {
            params: options.params,
            querystring: {
              ...options.querystring,
              establishment_siret: "not the right siret",
              skip: { allowAll: true },
            },
          },
        }),
      ])
      expectTokenInvalid(token)
    })
  })
})

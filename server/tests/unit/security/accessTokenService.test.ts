import { IUserRecruteur } from "shared"
import { ETAT_UTILISATEUR } from "shared/constants/recruteur"
import { z } from "shared/helpers/zodWithOpenApi"
import { zRoutes } from "shared/routes"
import { describe, expect, it } from "vitest"

import { SchemaWithSecurity, generateAccessToken, generateScope, parseAccessToken } from "../../../src/security/accessTokenService"
import { useMongo } from "../../utils/mongo.utils"
import { createUserRecruteurTest } from "../../utils/user.utils"

describe("accessTokenService", () => {
  let userACTIVE: IUserRecruteur
  let userPENDING: IUserRecruteur
  let userDISABLED: IUserRecruteur
  let userERROR: IUserRecruteur
  let userCFA
  let userLbaCompany

  const mockData = async () => {
    userACTIVE = await createUserRecruteurTest({}, ETAT_UTILISATEUR.VALIDE)
    userPENDING = await createUserRecruteurTest({}, ETAT_UTILISATEUR.ATTENTE)
    userDISABLED = await createUserRecruteurTest({}, ETAT_UTILISATEUR.DESACTIVE)
    userERROR = await createUserRecruteurTest({}, ETAT_UTILISATEUR.ERROR)
    userCFA = { type: "cfa" as const, email: "plop@gmail.com", siret: "12343154300012" }
    userLbaCompany = { type: "lba-company", email: "plop@gmail.com", siret: "12343154300012" }
  }

  useMongo(mockData, "beforeAll")
  // called route

  // useMongo --> create user pour chaque statut et tester le token et expect les differents cas.
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
  const expectTokenInvalid = (token: string) => expect(() => parseAccessToken(token, schema, options.params, options.querystring)).rejects.toThrow()

  describe("valid tokens", () => {
    describe("ACTIVE user", () => {
      it("should generate a token valid for a specific route", async () => {
        const token = generateAccessToken(userACTIVE, [
          generateScope({
            schema,
            options,
          }),
        ])
        await expectTokenValid(token)
      })
      it("should generate a token valid for a specific param and allow all querystring", async () => {
        const token = generateAccessToken(userACTIVE, [
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
        await expectTokenValid(token)
      })
    })
    describe("CFA", () => {
      it("should generate a token valid for a specific route", async () => {
        const token = generateAccessToken(userCFA, [
          generateScope({
            schema,
            options,
          }),
        ])
        await expectTokenValid(token)
      })
      it("should generate a token valid for a specific param and allow all querystring", async () => {
        const token = generateAccessToken(userCFA, [
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
        await expectTokenValid(token)
      })
    })
    describe("LBA COMPANY user", () => {
      it("should generate a token valid for a specific route", async () => {
        const token = generateAccessToken(userLbaCompany, [
          generateScope({
            schema,
            options,
          }),
        ])
        await expectTokenValid(token)
      })
      it("should generate a token valid for a specific param and allow all querystring", async () => {
        const token = generateAccessToken(userLbaCompany, [
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
        await expectTokenValid(token)
      })
    })
  })
  describe("invalid tokens", () => {
    describe("ERROR user", () => {
      it("should generate a token valid for a specific route but rejected from status", async () => {
        const token = generateAccessToken(userERROR, [
          generateScope({
            schema,
            options,
          }),
        ])
        await expectTokenInvalid(token)
      })
      it("should generate a token valid for a specific param and allow all querystring but rejected from status", async () => {
        const token = generateAccessToken(userERROR, [
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
        await expectTokenInvalid(token)
      })
    })
    describe("PENDING user", () => {
      it("should generate a token valid for a specific route but rejected from status", async () => {
        const token = generateAccessToken(userPENDING, [
          generateScope({
            schema,
            options,
          }),
        ])
        await expectTokenInvalid(token)
      })
      it("should generate a token valid for a specific param and allow all querystring but rejected from status", async () => {
        const token = generateAccessToken(userPENDING, [
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
        await expectTokenInvalid(token)
      })
    })
    describe("DISABLE user", () => {
      it("should generate a token valid for a specific route but rejected from status", async () => {
        const token = generateAccessToken(userDISABLED, [
          generateScope({
            schema,
            options,
          }),
        ])
        await expectTokenInvalid(token)
      })
      it("should generate a token valid for a specific param and allow all querystring but rejected from status", async () => {
        const token = generateAccessToken(userDISABLED, [
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
        await expectTokenInvalid(token)
      })
    })
    describe("CFA user", () => {
      it("should detect an invalid token that has a different param", async () => {
        const token = generateAccessToken(userCFA, [
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
        await expectTokenInvalid(token)
      })
      it("should detect an invalid token that has a different querystring", async () => {
        const token = generateAccessToken(userCFA, [
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
        await expectTokenInvalid(token)
      })
      it("should detect an invalid token that is for a different route", async () => {
        const token = generateAccessToken(userCFA, [
          generateScope({
            schema: zRoutes.post["/admin/users"],
            options: "all",
          }),
        ])
        await expectTokenInvalid(token)
      })
      it("should detect an invalid token that has an allowAll but not for all querystrings", async () => {
        const token = generateAccessToken(userCFA, [
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
        await expectTokenInvalid(token)
      })
    })
    describe("LBA COMPANY user", () => {
      it("should detect an invalid token that has a different param", async () => {
        const token = generateAccessToken(userLbaCompany, [
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
        await expectTokenInvalid(token)
      })
      it("should detect an invalid token that has a different querystring", async () => {
        const token = generateAccessToken(userLbaCompany, [
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
        await expectTokenInvalid(token)
      })
      it("should detect an invalid token that is for a different route", async () => {
        const token = generateAccessToken(userLbaCompany, [
          generateScope({
            schema: zRoutes.post["/admin/users"],
            options: "all",
          }),
        ])
        await expectTokenInvalid(token)
      })
      it("should detect an invalid token that has an allowAll but not for all querystrings", async () => {
        const token = generateAccessToken(userLbaCompany, [
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
        await expectTokenInvalid(token)
      })
    })
  })
})

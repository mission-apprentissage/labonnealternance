import { useMongo } from "@tests/utils/mongo.test.utils"
import { entrepriseStatusEventFactory, roleManagementEventFactory, saveEntrepriseUserTest } from "@tests/utils/user.test.utils"
import { zRoutes } from "shared"
import { z } from "shared/helpers/zodWithOpenApi"
import { EntrepriseStatus } from "shared/models/entreprise.model"
import { AccessStatus } from "shared/models/roleManagement.model"
import { describe, expect, it } from "vitest"

import {
  IUserWithAccountForAccessToken,
  SchemaWithSecurity,
  UserForAccessToken,
  generateAccessToken,
  generateScope,
  parseAccessToken,
  userWithAccountToUserForToken,
} from "./accessTokenService"

describe("accessTokenService", () => {
  let userACTIVE: IUserWithAccountForAccessToken
  let userPENDING: IUserWithAccountForAccessToken
  let userDISABLED: IUserWithAccountForAccessToken
  let userERROR: IUserWithAccountForAccessToken
  let userCFA
  let userLbaCompany

  const saveEntrepriseUserWithStatus = async (status: AccessStatus) => {
    const result = await saveEntrepriseUserTest(
      {},
      {
        status: [
          roleManagementEventFactory({
            status,
          }),
        ],
      }
    )
    return result.user
  }

  const mockData = async () => {
    userACTIVE = userWithAccountToUserForToken(await saveEntrepriseUserWithStatus(AccessStatus.GRANTED))
    userPENDING = userWithAccountToUserForToken(await saveEntrepriseUserWithStatus(AccessStatus.AWAITING_VALIDATION))
    userDISABLED = userWithAccountToUserForToken(await saveEntrepriseUserWithStatus(AccessStatus.DENIED))
    userERROR = userWithAccountToUserForToken(
      (
        await saveEntrepriseUserTest(
          {},
          {},
          {
            status: [entrepriseStatusEventFactory({ status: EntrepriseStatus.ERROR })],
          }
        )
      ).user
    )
    userCFA = { type: "cfa" as const, email: "plop@gmail.com", siret: "12343154300012" }
    userLbaCompany = { type: "lba-company", email: "plop@gmail.com", siret: "12343154300012" }
  }

  useMongo(mockData, "beforeAll")

  // called route
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
  const expectTokenValid = (token: string) => expect(parseAccessToken(token, schema, options.params, options.querystring)).resolves.toBeTruthy()
  const expectTokenInvalid = (token: string) => expect(() => parseAccessToken(token, schema, options.params, options.querystring)).rejects.toThrow()

  describe("valid tokens", () => {
    describe.each<[string, () => UserForAccessToken]>([
      ["ACTIVE user", () => userACTIVE],
      ["CFA", () => userCFA],
      ["LBA COMPANY user", () => userLbaCompany],
    ])("%s", (_name, getIdentity) => {
      it("should generate a token valid for a specific route", async () => {
        const token = generateAccessToken(getIdentity(), [
          generateScope({
            schema,
            options,
          }),
        ])
        await expectTokenValid(token)
      })
      it("should generate a token valid for a specific param and allow all querystring", async () => {
        const token = generateAccessToken(getIdentity(), [
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
    describe.each<[string, () => UserForAccessToken]>([
      ["ERROR user", () => userERROR],
      ["PENDING user", () => userPENDING],
      ["DISABLED user", () => userDISABLED],
      ["CFA user", () => userCFA],
      ["LBA COMPANY user", () => userLbaCompany],
    ])("%s", (_name, getIdentity) => {
      it("should detect an invalid token that has a different param", async () => {
        const token = generateAccessToken(getIdentity(), [
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
        const token = generateAccessToken(getIdentity(), [
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
        const token = generateAccessToken(getIdentity(), [
          generateScope({
            schema: zRoutes.post["/admin/users"],
            options: "all",
          }),
        ])
        await expectTokenInvalid(token)
      })
      it("should detect an invalid token that has an allowAll but not for all querystrings", async () => {
        const token = generateAccessToken(getIdentity(), [
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

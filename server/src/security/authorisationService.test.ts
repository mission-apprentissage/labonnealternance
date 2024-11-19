import { FastifyRequest } from "fastify"
import { ObjectId } from "mongodb"
import { OPCOS_LABEL } from "shared/constants"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { AuthStrategy, IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { AccessRessouces } from "shared/security/permissions"
import { describe, expect, it } from "vitest"

import { AccessUser2, AccessUserCredential, AccessUserToken } from "@/security/authenticationService"
import { authorizationMiddleware } from "@/security/authorisationService"
import { useMongo } from "@tests/utils/mongo.test.utils"
import { saveAdminUserTest, saveCfaUserTest, saveEntrepriseUserTest, saveOpcoUserTest } from "@tests/utils/user.test.utils"

type MockedRequest = Pick<FastifyRequest, "params" | "query">
const emptyRequest: MockedRequest = { params: {}, query: {} }

type ResourceType = keyof AccessRessouces

const givenARoute = ({
  authStrategy,
  resourceType,
  hasRequestedAccess = true,
}: {
  authStrategy: AuthStrategy
  resourceType?: ResourceType
  hasRequestedAccess?: boolean
}): Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme => {
  // TODO formationCatalogue don't have an _id
  return {
    method: "get",
    path: "/path",
    securityScheme: {
      access: hasRequestedAccess ? "recruiter:manage" : null,
      auth: authStrategy,
      resources: resourceType
        ? {
            [resourceType]: [{ _id: { type: "query", key: "resourceId" } }],
          }
        : {},
    },
  }
}

const everyResourceType: ResourceType[] = ["application", "appointment", "formationCatalogue", "job", "recruiter", "user"]
const everyAuthStrategy: AuthStrategy[] = ["access-token", "api-key", "cookie-session"]

const givenATokenUser = (): AccessUserToken => {
  return {
    type: "IAccessToken",
    value: {
      identity: {
        _id: "userId",
        email: "email@mail.com",
        type: "IUserRecruteur",
      },
      scopes: [],
    },
  }
}
// const givenACredentialUser = (): AccessUserCredential => {
//   return {
//     type: "ICredential",
//     value: {},
//   }
// }

const givenARequest = ({ user, resourceId }: { user: AccessUserToken | AccessUserCredential | AccessUser2; resourceId?: ObjectId }) => {
  return {
    ...emptyRequest,
    user,
    ...(resourceId ? { query: { resourceId } } : {}),
  }
}

describe("authorisationService", async () => {
  let adminUser: Awaited<ReturnType<typeof saveAdminUserTest>>
  let entrepriseUserA: Awaited<ReturnType<typeof saveEntrepriseUserTest>>
  let entrepriseUserB: Awaited<ReturnType<typeof saveEntrepriseUserTest>>
  let cfaUserA: Awaited<ReturnType<typeof saveCfaUserTest>>
  let cfaUserB: Awaited<ReturnType<typeof saveCfaUserTest>>
  let opcoUserA: Awaited<ReturnType<typeof saveOpcoUserTest>>
  let opcoUserB: Awaited<ReturnType<typeof saveOpcoUserTest>>

  useMongo(async () => {
    adminUser = await saveAdminUserTest()
    entrepriseUserA = await saveEntrepriseUserTest({}, {}, { opco: OPCOS_LABEL.AKTO })
    entrepriseUserB = await saveEntrepriseUserTest({}, {}, { opco: OPCOS_LABEL.EP })
    cfaUserA = await saveCfaUserTest()
    cfaUserB = await saveCfaUserTest()
    opcoUserA = await saveOpcoUserTest(OPCOS_LABEL.AKTO)
    opcoUserB = await saveOpcoUserTest(OPCOS_LABEL.EP)
  }, "beforeAll")

  const givenACookieUser = (user: IUserWithAccount): AccessUser2 => {
    return {
      type: "IUser2",
      value: user,
    }
  }

  const givenAnAdminUser = (): AccessUser2 => {
    return givenACookieUser(adminUser.user)
  }

  describe("authorizationMiddleware", () => {
    describe.each<AuthStrategy>(everyAuthStrategy)("given a route expecting a %s identity type", (authStrategy) => {
      it("should allow to call a route without requested access", async () => {
        await expect(authorizationMiddleware(givenARoute({ authStrategy, hasRequestedAccess: false }), emptyRequest)).resolves.toBe(undefined)
      })
      it("should reject an unidentified user", async () => {
        await expect(authorizationMiddleware(givenARoute({ authStrategy }), emptyRequest)).rejects.toThrow("User should be authenticated")
      })
    })
    describe.each<ResourceType>(everyResourceType)("given an accessed resource of type %s", (resourceType) => {
      it("should always allow a token user because authorization has been dealt with in the authentication layer", async () => {
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "access-token", resourceType }), givenARequest({ user: givenATokenUser(), resourceId: new ObjectId() }))
        ).resolves.toBe(undefined)
      })
      it("should always allow an admin user", async () => {
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType }), givenARequest({ user: givenAnAdminUser(), resourceId: new ObjectId() }))
        ).resolves.toBe(undefined)
      })
    })
    describe("user access", () => {
      it("an entreprise user should have access to its user", async () => {
        const user = entrepriseUserA.user
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType: "user" }), givenARequest({ user: givenACookieUser(user), resourceId: user._id }))
        ).resolves.toBe(undefined)
      })
      it("an entreprise user should NOT have access to another user", async () => {
        const user = entrepriseUserA.user
        const accessedUser = cfaUserA.user
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "user" }),
            givenARequest({ user: givenACookieUser(user), resourceId: accessedUser._id })
          )
        ).rejects.toThrow("non autorisé")
      })
      it("an opco user should NOT have access to an user who doesn't relate to it's opco", async () => {
        const user = opcoUserA.user
        const accessedUser = opcoUserB.user
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "user" }),
            givenARequest({ user: givenACookieUser(user), resourceId: accessedUser._id })
          )
        ).rejects.toThrow("non autorisé")
      })
      it("a cfa user should have access to its user", async () => {
        const user = cfaUserA.user
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType: "user" }), givenARequest({ user: givenACookieUser(user), resourceId: user._id }))
        ).resolves.toBe(undefined)
      })
      it("an opco user should have access to its user", async () => {
        const user = opcoUserA.user
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType: "user" }), givenARequest({ user: givenACookieUser(user), resourceId: user._id }))
        ).resolves.toBe(undefined)
      })
      it("an opco user should NOT have access to another opco's user", async () => {
        const user = opcoUserB.user
        const targetOpcoUser = entrepriseUserA.user
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "user" }),
            givenARequest({ user: givenACookieUser(user), resourceId: targetOpcoUser._id })
          )
        ).rejects.toThrow("non autorisé")
      })
      it("an opco user should have access to it's users", async () => {
        const user = opcoUserA.user
        const targetOpcoUser = entrepriseUserA.user
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "user" }),
            givenARequest({ user: givenACookieUser(user), resourceId: targetOpcoUser._id })
          )
        ).resolves.toBe(undefined)
      })
    })
    describe("job access", () => {
      it("an entreprise user should have access to its jobs", async () => {
        const { user, recruiter } = entrepriseUserA
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType: "job" }), givenARequest({ user: givenACookieUser(user), resourceId: job._id }))
        ).resolves.toBe(undefined)
      })
      it("an entreprise user should NOT have access to another entreprise's jobs", async () => {
        const user = entrepriseUserA.user
        const { recruiter } = entrepriseUserB
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType: "job" }), givenARequest({ user: givenACookieUser(user), resourceId: job._id }))
        ).rejects.toThrow("non autorisé")
      })
      it("a cfa user should have access to its jobs", async () => {
        const { user, recruiter } = cfaUserA
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType: "job" }), givenARequest({ user: givenACookieUser(user), resourceId: job._id }))
        ).resolves.toBe(undefined)
      })
      it("a cfa user should NOT have access to another cfa's job", async () => {
        const user = cfaUserA.user
        const { recruiter } = cfaUserB
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType: "job" }), givenARequest({ user: givenACookieUser(user), resourceId: job._id }))
        ).rejects.toThrow("non autorisé")
      })
      it("a cfa user should NOT have access to another entreprise job", async () => {
        const user = cfaUserA.user
        const { recruiter } = entrepriseUserA
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType: "job" }), givenARequest({ user: givenACookieUser(user), resourceId: job._id }))
        ).rejects.toThrow("non autorisé")
      })
    })
  })
})

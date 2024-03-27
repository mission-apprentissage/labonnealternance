import { FastifyRequest } from "fastify"
import { OPCOS, RECRUITER_STATUS, VALIDATION_UTILISATEUR } from "shared/constants/recruteur"
import { AccessEntityType, AccessStatus, IRoleManagementEvent } from "shared/models/roleManagement.model"
import { IUser2 } from "shared/models/user2.model"
import { AuthStrategy, IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { AccessRessouces } from "shared/security/permissions"
import { describe, expect, it } from "vitest"

import { AccessUser2, AccessUserCredential, AccessUserToken } from "@/security/authenticationService"
import { authorizationMiddleware } from "@/security/authorisationService"
import { useMongo } from "@tests/utils/mongo.utils"

import { jobFactory, saveCfa, saveEntreprise, saveRecruiter, saveRoleManagement, saveUser2 } from "../../utils/user.utils"

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

const roleManagementEventFactory = ({
  date = new Date(),
  granted_by,
  reason = "reason",
  status = AccessStatus.GRANTED,
  validation_type = VALIDATION_UTILISATEUR.AUTO,
}: Partial<IRoleManagementEvent> = {}): IRoleManagementEvent => {
  return {
    date,
    granted_by,
    reason,
    status,
    validation_type,
  }
}

const createAdminUser = async () => {
  const user = await saveUser2()
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_type: AccessEntityType.ADMIN,
    authorized_id: undefined,
    status: [roleManagementEventFactory()],
  })
  return { user, role }
}

const createEntrepriseUser = async () => {
  const user = await saveUser2()
  const entreprise = await saveEntreprise()
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: entreprise._id.toString(),
    authorized_type: AccessEntityType.ENTREPRISE,
    status: [roleManagementEventFactory()],
  })
  const recruiter = await saveRecruiter({
    is_delegated: false,
    cfa_delegated_siret: null,
    status: RECRUITER_STATUS.ACTIF,
    establishment_siret: entreprise.siret,
    opco: entreprise.opco,
    jobs: [
      jobFactory({
        managed_by: user._id,
      }),
    ],
  })
  return { user, role, entreprise, recruiter }
}

const createCfaUser = async () => {
  const user = await saveUser2()
  const cfa = await saveCfa()
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: cfa._id.toString(),
    authorized_type: AccessEntityType.CFA,
    status: [roleManagementEventFactory()],
  })
  const recruiter = await saveRecruiter({
    is_delegated: true,
    cfa_delegated_siret: cfa.siret,
    status: RECRUITER_STATUS.ACTIF,
    jobs: [
      jobFactory({
        managed_by: user._id,
      }),
    ],
  })
  return { user, role, cfa, recruiter }
}

const createOpcoUser = async () => {
  const user = await saveUser2()
  const role = await saveRoleManagement({
    user_id: user._id,
    authorized_id: OPCOS.AKTO,
    authorized_type: AccessEntityType.OPCO,
    status: [roleManagementEventFactory()],
  })
  return { user, role }
}

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

const givenARequest = ({ user, resourceId }: { user: AccessUserToken | AccessUserCredential | AccessUser2; resourceId?: string }) => {
  return {
    ...emptyRequest,
    user,
    ...(resourceId ? { query: { resourceId } } : {}),
  }
}

describe("authorisationService", async () => {
  let adminUser: Awaited<ReturnType<typeof createAdminUser>>
  let entrepriseUserA: Awaited<ReturnType<typeof createEntrepriseUser>>
  let entrepriseUserB: Awaited<ReturnType<typeof createEntrepriseUser>>
  let cfaUserA: Awaited<ReturnType<typeof createCfaUser>>
  let cfaUserB: Awaited<ReturnType<typeof createCfaUser>>
  let opcoUserA: Awaited<ReturnType<typeof createOpcoUser>>

  useMongo(async () => {
    adminUser = await createAdminUser()
    entrepriseUserA = await createEntrepriseUser()
    entrepriseUserB = await createEntrepriseUser()
    cfaUserA = await createCfaUser()
    cfaUserB = await createCfaUser()
    opcoUserA = await createOpcoUser()
  }, "beforeAll")

  const givenACookieUser = (user: IUser2): AccessUser2 => {
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
      it("should always allow a token user", async () => {
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "access-token", resourceType }), givenARequest({ user: givenATokenUser(), resourceId: "resourceId" }))
        ).resolves.toBe(undefined)
      })
      it("should always allow an admin user", async () => {
        await expect(
          authorizationMiddleware(givenARoute({ authStrategy: "cookie-session", resourceType }), givenARequest({ user: givenAnAdminUser(), resourceId: "resourceId" }))
        ).resolves.toBe(undefined)
      })
    })
    describe("user access", () => {
      it("an entreprise user should have access to its user", async () => {
        const user = entrepriseUserA.user
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "user" }),
            givenARequest({ user: givenACookieUser(user), resourceId: user._id.toString() })
          )
        ).resolves.toBe(undefined)
      })
      it("an entreprise user should NOT have access to another user", async () => {
        const user = entrepriseUserA.user
        const accessedUser = cfaUserA.user
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "user" }),
            givenARequest({ user: givenACookieUser(user), resourceId: accessedUser._id.toString() })
          )
        ).rejects.toThrow("non autorisé")
      })
      it("a cfa user should have access to its user", async () => {
        const user = cfaUserA.user
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "user" }),
            givenARequest({ user: givenACookieUser(user), resourceId: user._id.toString() })
          )
        ).resolves.toBe(undefined)
      })
      it("an opco user should have access to its user", async () => {
        const user = opcoUserA.user
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "user" }),
            givenARequest({ user: givenACookieUser(user), resourceId: user._id.toString() })
          )
        ).resolves.toBe(undefined)
      })
    })
    describe("job access", () => {
      it("an entreprise user should have access to its jobs", async () => {
        const { user, recruiter } = entrepriseUserA
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "job" }),
            givenARequest({ user: givenACookieUser(user), resourceId: job._id.toString() })
          )
        ).resolves.toBe(undefined)
      })
      it("an entreprise user should NOT have access to another entreprise jobs", async () => {
        const user = entrepriseUserA.user
        const { recruiter } = entrepriseUserB
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "job" }),
            givenARequest({ user: givenACookieUser(user), resourceId: job._id.toString() })
          )
        ).rejects.toThrow("non autorisé")
      })
      it("a cfa user should have access to its jobs", async () => {
        const { user, recruiter } = cfaUserA
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "job" }),
            givenARequest({ user: givenACookieUser(user), resourceId: job._id.toString() })
          )
        ).resolves.toBe(undefined)
      })
      it("a cfa user should NOT have access to another cfa job", async () => {
        const user = cfaUserA.user
        const { recruiter } = cfaUserB
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "job" }),
            givenARequest({ user: givenACookieUser(user), resourceId: job._id.toString() })
          )
        ).rejects.toThrow("non autorisé")
      })
      it("a cfa user should NOT have access to another entreprise job", async () => {
        const user = cfaUserA.user
        const { recruiter } = entrepriseUserA
        const [job] = recruiter.jobs
        await expect(
          authorizationMiddleware(
            givenARoute({ authStrategy: "cookie-session", resourceType: "job" }),
            givenARequest({ user: givenACookieUser(user), resourceId: job._id.toString() })
          )
        ).rejects.toThrow("non autorisé")
      })
    })
  })
})

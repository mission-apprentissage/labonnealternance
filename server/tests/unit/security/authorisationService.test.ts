import { FastifyRequest } from "fastify"
import { ObjectId } from "mongodb"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { IApplication, ICredential, IJob, IRecruiter, IUserRecruteur, ZApplication, ZCredential, ZRecruiter, ZUserRecruteur } from "shared/models"
import { zObjectId } from "shared/models/common"
import { SecurityScheme } from "shared/routes/common.routes"
import { AccessPermission, AccessRessouces, Permission, UserWithType } from "shared/security/permissions"
import { beforeEach, describe, expect, it } from "vitest"
import { Fixture, Generator } from "zod-fixture"

import { Application, Credential, Recruiter, UserRecruteur } from "@/common/model"
import { IAccessToken, generateScope } from "@/security/accessTokenService"
import { authorizationnMiddleware } from "@/security/authorisationService"
import { useMongo } from "@tests/utils/mongo.utils"

let seed = 0
function getFixture() {
  seed++
  return new Fixture({ seed }).extend([
    Generator({
      schema: zObjectId,
      output: () => new ObjectId(),
    }),
    Generator({
      schema: extensions.siret,
      output: ({ transform }) =>
        transform.utils.random.from([
          "55327987900672",
          "55327987900673",
          "55327987900674",
          "55327987900675",
          "55327987900676",
          "55327987900677",
          "73282932000074",
          "35600000000048",
          "35600000009075",
          "35600000009093",
        ]),
    }),
  ])
}

async function createUserRecruteur(data: Partial<IUserRecruteur>) {
  const u = new UserRecruteur({
    ...getFixture().fromSchema(ZUserRecruteur),
    status: [],
    ...data,
  })
  await u.save()
  return u
}

async function createCredential(data: Partial<ICredential>) {
  const u = new Credential({
    ...getFixture().fromSchema(ZCredential),
    ...data,
  })
  await u.save()
  return u
}

async function createRecruteur(data: Partial<IRecruiter>, jobsData: Partial<IJob>[]) {
  const u = new Recruiter({
    ...getFixture().fromSchema(ZRecruiter),
    ...data,
    jobs: jobsData.map((d) => {
      return {
        ...getFixture().fromSchema(ZRecruiter),
        ...d,
      }
    }),
  })
  await u.save()
  return u
}

async function createApplication(data: Partial<IApplication>) {
  const u = new Application({
    ...getFixture().fromSchema(ZApplication),
    ...data,
  })
  await u.save()
  return u
}

describe("authorisationService", () => {
  beforeEach(() => {
    seed = 0
  })

  let adminUser: IUserRecruteur
  let opcoUserO1U1: IUserRecruteur
  let opcoUserO1U2: IUserRecruteur
  let cfaUser1: IUserRecruteur
  let cfaUser2: IUserRecruteur
  let recruteurUserO1E1R1: IUserRecruteur
  let recruteurO1E1R1: IRecruiter
  let recruteurUserO1E1R2: IUserRecruteur
  let recruteurO1E1R2: IRecruiter
  let recruteurUserO1E2R1: IUserRecruteur
  let recruteurO1E2R1: IRecruiter
  let opcoUserO2U1: IUserRecruteur
  let recruteurUserO2E1R1: IUserRecruteur
  let recruteurO2E1R1: IRecruiter
  let credentialO1: ICredential
  let applicationO1E1R1J1A1: IApplication
  let applicationO1E1R1J1A2: IApplication
  let applicationO1E1R1J2A1: IApplication
  let applicationO1E1R2J1A1: IApplication

  function getResourceAccessKey(resource: IUserRecruteur | IRecruiter | IJob | IApplication, i: number): string {
    if (resource instanceof UserRecruteur) {
      return `userId${i}`
    }
    if (resource instanceof Recruiter) {
      return `recruiterId${i}`
    }
    if (resource instanceof Application) {
      return `applicationId${i}`
    }

    return `jobId${i}`
  }

  function generateSecuritySchemeFixture(
    access: AccessPermission,
    ressources: ReadonlyArray<IUserRecruteur | IRecruiter | IJob | IApplication>,
    location: "params" | "query"
  ): [SecurityScheme, Pick<FastifyRequest, "params" | "query">] {
    return [
      {
        auth: "cookie-session",
        access,
        resources: ressources.reduce((acc, resource, i) => {
          const key = getResourceAccessKey(resource, i)
          if (resource instanceof UserRecruteur) {
            const user = acc.user ?? []
            acc.user = [...user, { _id: { type: location, key } }]
            return {
              ...acc,
              user: [...user, { _id: { type: location, key } }],
            }
          }
          if (resource instanceof Recruiter) {
            const recruiter = acc.recruiter ?? []
            return {
              ...acc,
              recruiter: [...recruiter, { _id: { type: location, key } }],
            }
          }
          if (resource instanceof Application) {
            const application = acc.application ?? []
            return {
              ...acc,
              application: [...application, { _id: { type: location, key } }],
            }
          }
          const job = acc.job ?? []
          return {
            ...acc,
            job: [...job, { _id: { type: location, key } }],
          }
        }, {} as AccessRessouces),
      },
      ressources.reduce(
        (acc, resource, i) => {
          const p = acc[location] ?? {}
          p[getResourceAccessKey(resource, i)] = resource._id
          acc[location] = p

          return acc
        },
        {} as Record<"params" | "query", Record<string, unknown>>
      ),
    ]
  }

  const mockData = async () => {
    // Here is the overall relation we will use to test permissions

    // CfaUser  #1
    // CfaUser  #2
    // OPCO #O1
    //  |--- OpcoUser #O1#U1
    //  |--- OpcoUser #O1#U2
    //  |--- Entreprise #O1#E1
    //       --> Recruteur #O1#E1#R1 --> Delegated #01#U3
    //           --> Job #O1#E1#R1#J1
    //               --> Application #O1#E1#R1#J1#A1
    //               --> Application #O1#E1#R1#J1#A2
    //           --> Job #O1#E1#R1#J2
    //               --> Application #O1#E1#R1#J2#A1
    //       --> Recruteur #O1#E1#R2
    //           --> Job #O1#E1#R2#J1
    //               --> Application #O1#E1#R2#J1#A1
    //           --> Job #O1#E1#R2#J2
    //  |--- Entreprise #O1#E2
    //       --> Recruteur #O1#E2#R1
    //           --> Job #O1#E2#R1#J1
    // OPCO #O2
    //  |--- Entreprise #O2#E1
    //       --> Recruteur #O2#E1#R1
    //           --> Job #O2#E1#R1#J1
    //  |--- OpcoUser #O2#U1

    const CFA_SIRET = "80300515600044"
    const O1E1R1J1Id = new ObjectId()
    const O1E1R1J2Id = new ObjectId()
    const O1E1R2J1Id = new ObjectId()
    const O1E1Siret = "88160687500014"
    const O1E2Siret = "38959133000060"

    adminUser = await createUserRecruteur({
      type: "ADMIN",
    })

    opcoUserO1U1 = await createUserRecruteur({
      type: "OPCO",
      scope: "#O1",
      first_name: "O1U1",
    })
    opcoUserO1U2 = await createUserRecruteur({
      type: "OPCO",
      scope: "#O1",
      first_name: "O1U2",
    })
    cfaUser1 = await createUserRecruteur({
      type: "CFA",
      first_name: "O1",
      establishment_siret: CFA_SIRET,
    })

    recruteurUserO1E1R1 = await createUserRecruteur({
      type: "ENTREPRISE",
      opco: "#O1",
      establishment_id: "#O1#E1#R1",
      establishment_siret: O1E1Siret,
    })
    recruteurO1E1R1 = await createRecruteur(
      {
        opco: "#O1",
        establishment_id: "#O1#E1#R1",
        cfa_delegated_siret: CFA_SIRET,
        establishment_siret: O1E1Siret,
      },
      [
        { _id: O1E1R1J1Id, job_description: "#O1#E1#R1#J1" },
        { _id: O1E1R1J2Id, job_description: "#O1#E1#R1#J2" },
      ]
    )
    applicationO1E1R1J1A1 = await createApplication({
      job_id: O1E1R1J1Id.toString(),
      job_origin: "matcha",
      applicant_message_to_company: "#O1#E1#R1#J1#A1",
    })
    applicationO1E1R1J1A2 = await createApplication({
      job_id: O1E1R1J1Id.toString(),
      job_origin: "matcha",
      applicant_message_to_company: "#O1#E1#R1#J1#A2",
    })
    applicationO1E1R1J2A1 = await createApplication({
      job_id: O1E1R1J2Id.toString(),
      job_origin: "matcha",
      applicant_message_to_company: "#O1#E1#R1#J2#A1",
    })

    recruteurUserO1E1R2 = await createUserRecruteur({
      type: "ENTREPRISE",
      opco: "#O1",
      establishment_id: "#O1#E1#R2",
      establishment_siret: O1E1Siret,
    })
    recruteurO1E1R2 = await createRecruteur(
      {
        opco: "#O1",
        establishment_id: "#O1#E1#R2",
        establishment_siret: O1E1Siret,
      },
      [{ _id: O1E1R2J1Id, job_description: "#O1#E1#R2#J1" }]
    )
    applicationO1E1R2J1A1 = await createApplication({
      job_id: O1E1R2J1Id.toString(),
      job_origin: "matcha",
      applicant_message_to_company: "#O1#E1#R2#J1#A1",
    })

    recruteurUserO1E2R1 = await createUserRecruteur({
      type: "ENTREPRISE",
      opco: "#O1",
      establishment_id: "#O1#E2#R1",
      establishment_siret: O1E2Siret,
    })
    recruteurO1E2R1 = await createRecruteur(
      {
        opco: "#O1",
        establishment_id: "#O1#E2#R1",
        establishment_siret: O1E2Siret,
      },
      [{ job_description: "#O1#E2#R1#J1" }]
    )

    opcoUserO2U1 = await createUserRecruteur({
      type: "OPCO",
      scope: "#O2",
      first_name: "O2U1",
    })
    cfaUser2 = await createUserRecruteur({
      type: "CFA",
      scope: "#O2",
      first_name: "O2",
    })

    recruteurUserO2E1R1 = await createUserRecruteur({
      type: "ENTREPRISE",
      scope: "#O2",
      establishment_id: "#O2#E1#R1",
    })
    recruteurO2E1R1 = await createRecruteur(
      {
        opco: "#O2",
        establishment_id: "#O2#E1#R1",
      },
      [{ job_description: "#O2#E1#R1#J1" }]
    )

    credentialO1 = await createCredential({
      organisation: "#O1",
    })
  }

  useMongo(mockData, "beforeAll")

  describe.each<["params" | "query"]>([["params"], ["query"]])("when resources are identified in %s", (location) => {
    describe("as an admin user", () => {
      describe.each<[Permission]>([
        ["recruiter:manage"],
        ["recruiter:validate"],
        ["recruiter:add_job"],
        ["job:manage"],
        ["school:manage"],
        ["application:manage"],
        ["user:manage"],
        ["admin"],
      ])("I have %s permission", (permission) => {
        it("on all ressources", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(
            permission,
            [
              adminUser,
              opcoUserO1U1,
              opcoUserO1U2,
              cfaUser2,
              recruteurUserO1E1R1,
              recruteurO1E1R1,
              ...recruteurO1E1R1.jobs,
              recruteurUserO1E1R2,
              recruteurO1E1R2,
              ...recruteurO1E1R2.jobs,
              recruteurUserO1E2R1,
              recruteurO1E2R1,
              ...recruteurO1E2R1.jobs,
              opcoUserO2U1,
              cfaUser1,
              recruteurUserO2E1R1,
              recruteurO2E1R1,
              ...recruteurO2E1R1.jobs,
              applicationO1E1R1J1A1,
              applicationO1E1R1J1A2,
              applicationO1E1R1J2A1,
            ],
            location
          )
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: adminUser,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
    })

    describe("as an opco user", () => {
      describe.each<[Permission]>([["recruiter:manage"], ["recruiter:validate"], ["recruiter:add_job"]])("I have %s permission", (permission) => {
        it("on all recruiters from my opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO1E1R1, recruteurO1E1R2, recruteurO1E2R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["job:manage"]])("I have %s permission", (permission) => {
        it("on all jobs from my opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [...recruteurO1E1R1.jobs, ...recruteurO1E1R2.jobs, ...recruteurO1E2R1.jobs], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["user:manage"]])("I have %s permission", (permission) => {
        it("on myself", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [opcoUserO1U1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["user:manage"]])("I have %s permission", (permission) => {
        it("on user recruiter from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurUserO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })

      describe.each<[Permission]>([["recruiter:manage"], ["recruiter:validate"], ["recruiter:add_job"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on recruiter from other Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO2E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })
      describe.each<[Permission]>([["job:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on jobs from other Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [...recruteurO2E1R1.jobs], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["school:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on school", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUser1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["application:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on application from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [applicationO1E1R1J1A1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["admin"]])("I do not have %s permission", (permission) => {
        it("on user recruiter from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurUserO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on admin user", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [adminUser], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on user CFA", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUser1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on other user Opco from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [opcoUserO1U2], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: opcoUserO1U1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })
    })

    describe("as an opco credential", () => {
      describe.each<[Permission]>([["recruiter:manage"], ["recruiter:validate"], ["recruiter:add_job"]])("I have %s permission", (permission) => {
        it("on all recruiters from my opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO1E1R1, recruteurO1E1R2, recruteurO1E2R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["job:manage"]])("I have %s permission", (permission) => {
        it("on all jobs from my opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [...recruteurO1E1R1.jobs, ...recruteurO1E1R2.jobs, ...recruteurO1E2R1.jobs], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["user:manage"]])("I have %s permission", (permission) => {
        it("on myself", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [opcoUserO1U1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })

      describe.each<[Permission]>([["recruiter:manage"], ["recruiter:validate"], ["recruiter:add_job"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on recruiter from other Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO2E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })
      describe.each<[Permission]>([["job:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on jobs from other Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [...recruteurO2E1R1.jobs], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["school:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on school", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUser1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["application:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on application from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [applicationO1E1R1J1A1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on user recruiter from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurUserO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on admin user", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [adminUser], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on user CFA", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUser1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"]])("I have %s permission", (permission) => {
        it("on user Opco from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [opcoUserO1U2], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })

      describe.each<[Permission]>([["admin"]])("I do not have %s permission", (permission) => {
        it("on user Opco from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [opcoUserO1U2], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "ICredential",
                  value: credentialO1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })
    })

    describe("as a cfa user", () => {
      describe.each<[Permission]>([["recruiter:manage"], ["recruiter:add_job"]])("I have %s permission", (permission) => {
        it("on all my delegated recruiters", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["job:manage"]])("I have %s permission", (permission) => {
        it("on all jobs from my delegated recruiters", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [...recruteurO1E1R1.jobs], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["user:manage"], ["school:manage"]])("I have %s permission", (permission) => {
        it("on myself", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUser1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })

      describe.each<[Permission]>([["recruiter:validate"]])("I do not have %s permission", (permission) => {
        it("on all my delegated recruiters", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["recruiter:manage"], ["recruiter:validate"], ["recruiter:add_job"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on non delegated recruiters", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO1E1R2], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })
      describe.each<[Permission]>([["job:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on non delegated recruiters", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [...recruteurO1E1R2.jobs], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["school:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on other schools", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUser2], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["application:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on application of my delegated recruiter", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [applicationO1E1R1J1A1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on user recruiter", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurUserO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on admin user", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [adminUser], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on user Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [opcoUserO1U1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: cfaUser1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })
    })

    describe("as a recruiter user", () => {
      describe.each<[Permission]>([["recruiter:manage"], ["recruiter:add_job"]])("I have %s permission", (permission) => {
        it("on me", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["job:manage"]])("I have %s permission", (permission) => {
        it("on my jobs", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [...recruteurO1E1R1.jobs], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["application:manage"]])("I have %s permission", (permission) => {
        it("on my applications", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [applicationO1E1R1J1A1, applicationO1E1R1J1A2], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["user:manage"]])("I have %s permission", (permission) => {
        it("on myself", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurUserO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })

      describe.each<[Permission]>([["recruiter:validate"]])("I do not have %s permission", (permission) => {
        it("on me", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO1E1R1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["recruiter:manage"], ["recruiter:validate"], ["recruiter:add_job"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on other recruiters from my company", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurO1E1R2], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["job:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on job from other recruiters from my company", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [...recruteurO1E1R2.jobs], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["application:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on other applications", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [applicationO1E1R2J1A1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["school:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on school", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUser1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"]])("I do not have %s permission", (permission) => {
        it("on other user recruiter", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [recruteurUserO1E1R2], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on admin user", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [adminUser], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["user:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on user Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [opcoUserO1U1], location)
          await expect(
            authorizationnMiddleware(
              {
                method: "get",
                path: "/path",
                securityScheme,
              },
              {
                user: {
                  type: "IUserRecruteur",
                  value: recruteurUserO1E1R1,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })
    })
  })

  it("should support retrieving recruiter resource per establishment_id", async () => {
    const securityScheme: SecurityScheme = {
      auth: "cookie-session",
      access: "recruiter:manage",
      resources: {
        recruiter: [
          {
            establishment_id: {
              type: "query",
              key: "establishment_id",
            },
          },
        ],
      },
    }

    const query = {
      establishment_id: recruteurO1E1R1.establishment_id,
    }

    await expect(
      authorizationnMiddleware(
        {
          method: "get",
          path: "/path",
          securityScheme,
        },
        {
          user: {
            type: "IUserRecruteur",
            value: recruteurUserO1E1R1,
          },
          query,
          params: {},
        }
      )
    ).resolves.toBe(undefined)
    await expect(
      authorizationnMiddleware(
        {
          method: "get",
          path: "/path",
          securityScheme,
        },
        {
          user: {
            type: "IUserRecruteur",
            value: recruteurUserO1E1R2,
          },
          query,
          params: {},
        }
      )
    ).rejects.toThrow("Forbidden")
  })

  it("should support some operator permission", async () => {
    const securityScheme: SecurityScheme = {
      auth: "cookie-session",
      access: { some: ["recruiter:manage", "recruiter:validate"] },
      resources: {
        recruiter: [
          {
            establishment_id: {
              type: "query",
              key: "establishment_id",
            },
          },
        ],
      },
    }

    const query = {
      establishment_id: recruteurO1E1R1.establishment_id,
    }

    await expect(
      authorizationnMiddleware(
        {
          method: "get",
          path: "/path",
          securityScheme,
        },
        {
          user: {
            type: "IUserRecruteur",
            value: recruteurUserO1E1R1,
          },
          query,
          params: {},
        }
      )
    ).resolves.toBe(undefined)
    await expect(
      authorizationnMiddleware(
        {
          method: "get",
          path: "/path",
          securityScheme,
        },
        {
          user: {
            type: "IUserRecruteur",
            value: recruteurUserO1E1R2,
          },
          query,
          params: {},
        }
      )
    ).rejects.toThrow("Forbidden")
  })

  it("should support every operator permission", async () => {
    const securityScheme: SecurityScheme = {
      auth: "cookie-session",
      access: { every: ["recruiter:manage", "recruiter:validate"] },
      resources: {
        recruiter: [
          {
            establishment_id: {
              type: "query",
              key: "establishment_id",
            },
          },
        ],
      },
    }

    const query = {
      establishment_id: recruteurO1E1R1.establishment_id,
    }

    await expect(
      authorizationnMiddleware(
        {
          method: "get",
          path: "/path",
          securityScheme,
        },
        {
          user: {
            type: "IUserRecruteur",
            value: opcoUserO1U1,
          },
          query,
          params: {},
        }
      )
    ).resolves.toBe(undefined)
    await expect(
      authorizationnMiddleware(
        {
          method: "get",
          path: "/path",
          securityScheme,
        },
        {
          user: {
            type: "IUserRecruteur",
            value: recruteurUserO1E1R1,
          },
          query,
          params: {},
        }
      )
    ).rejects.toThrow("Forbidden")
  })

  it("should support null access", async () => {
    const securityScheme: SecurityScheme = {
      auth: "cookie-session",
      access: null,
      resources: {},
    }

    await expect(
      authorizationnMiddleware(
        {
          method: "get",
          path: "/path",
          securityScheme,
        },
        {
          user: {
            type: "IUserRecruteur",
            value: opcoUserO1U1,
          },
          query: {},
          params: {},
        }
      )
    ).resolves.toBe(undefined)
  })

  describe("with access token", () => {
    describe("when accessing recruiter resource", () => {
      it("should allow when resource is present in token for same scope", async () => {
        const securityScheme: SecurityScheme = {
          auth: "cookie-session",
          access: "recruiter:manage",
          resources: {
            recruiter: [{ _id: { type: "params", key: "id" } }],
          },
        }
        const userWithType: UserWithType<"IAccessToken", IAccessToken> = {
          type: "IAccessToken",
          value: {
            identity: { type: "cfa", email: "mail@mail.com", siret: "55327987900672" },
            scopes: [
              generateScope({
                schema: {
                  method: "post",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {},
              }),
              generateScope({
                schema: {
                  method: "get",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {
                  recruiter: [recruteurO1E1R1._id.toString()],
                },
              }),
            ],
          },
        }

        await expect(
          authorizationnMiddleware(
            {
              method: "get",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: recruteurO1E1R1._id.toString(),
              },
            }
          )
        ).resolves.toBe(undefined)
      })

      it("should deny when resource is not present in token for same scope", async () => {
        const securityScheme: SecurityScheme = {
          auth: "cookie-session",
          access: "recruiter:manage",
          resources: {
            recruiter: [{ _id: { type: "params", key: "id" } }],
          },
        }
        const userWithType: UserWithType<"IAccessToken", IAccessToken> = {
          type: "IAccessToken",
          value: {
            identity: { type: "cfa", email: "mail@mail.com", siret: "55327987900672" },
            scopes: [
              generateScope({
                schema: {
                  method: "post",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {},
              }),
              generateScope({
                schema: {
                  method: "get",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {
                  recruiter: [recruteurO1E1R1._id.toString()],
                },
              }),
            ],
          },
        }

        await expect(
          authorizationnMiddleware(
            {
              method: "post",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: recruteurO1E1R1._id.toString(),
              },
            }
          )
        ).rejects.toThrow("Forbidden")

        await expect(
          authorizationnMiddleware(
            {
              method: "get",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: recruteurO1E1R2._id.toString(),
              },
            }
          )
        ).rejects.toThrow("Forbidden")
      })
    })
    describe("when accessing job resource", () => {
      it("should allow when resource is present in token for same scope", async () => {
        const securityScheme: SecurityScheme = {
          auth: "cookie-session",
          access: "job:manage",
          resources: {
            job: [{ _id: { type: "params", key: "id" } }],
          },
        }
        const userWithType: UserWithType<"IAccessToken", IAccessToken> = {
          type: "IAccessToken",
          value: {
            identity: { type: "cfa", email: "mail@mail.com", siret: "55327987900672" },
            scopes: [
              generateScope({
                schema: {
                  method: "post",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {},
              }),
              generateScope({
                schema: {
                  method: "get",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {
                  job: recruteurO1E1R1.jobs.map((j) => j._id.toString()),
                },
              }),
            ],
          },
        }

        await expect(
          authorizationnMiddleware(
            {
              method: "get",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: recruteurO1E1R1.jobs.map((j) => j._id.toString())[0],
              },
            }
          )
        ).resolves.toBe(undefined)
      })

      it("should deny when resource is not present in token for same scope", async () => {
        const securityScheme: SecurityScheme = {
          auth: "cookie-session",
          access: "job:manage",
          resources: {
            job: [{ _id: { type: "params", key: "id" } }],
          },
        }
        const userWithType: UserWithType<"IAccessToken", IAccessToken> = {
          type: "IAccessToken",
          value: {
            identity: { type: "cfa", email: "mail@mail.com", siret: "55327987900672" },
            scopes: [
              generateScope({
                schema: {
                  method: "post",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {},
              }),
              generateScope({
                schema: {
                  method: "get",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {
                  job: recruteurO1E1R1.jobs.map((j) => j._id.toString()),
                },
              }),
            ],
          },
        }

        await expect(
          authorizationnMiddleware(
            {
              method: "post",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: recruteurO1E1R1.jobs.map((j) => j._id.toString())[0],
              },
            }
          )
        ).rejects.toThrow("Forbidden")

        await expect(
          authorizationnMiddleware(
            {
              method: "get",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: recruteurO1E1R2.jobs.map((j) => j._id.toString())[0],
              },
            }
          )
        ).rejects.toThrow("Forbidden")
      })
    })
    describe("when accessing application resource", () => {
      it("should allow when resource is present in token for same scope", async () => {
        const securityScheme: SecurityScheme = {
          auth: "cookie-session",
          access: "application:manage",
          resources: {
            application: [{ _id: { type: "params", key: "id" } }],
          },
        }
        const userWithType: UserWithType<"IAccessToken", IAccessToken> = {
          type: "IAccessToken",
          value: {
            identity: { type: "cfa", email: "mail@mail.com", siret: "55327987900672" },
            scopes: [
              generateScope({
                schema: {
                  method: "post",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {},
              }),
              generateScope({
                schema: {
                  method: "get",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {
                  application: [applicationO1E1R1J1A1._id.toString()],
                },
              }),
            ],
          },
        }

        await expect(
          authorizationnMiddleware(
            {
              method: "get",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: applicationO1E1R1J1A1._id.toString(),
              },
            }
          )
        ).resolves.toBe(undefined)
      })

      it("should deny when resource is not present in token for same scope", async () => {
        const securityScheme: SecurityScheme = {
          auth: "cookie-session",
          access: "application:manage",
          resources: {
            application: [{ _id: { type: "params", key: "id" } }],
          },
        }
        const userWithType: UserWithType<"IAccessToken", IAccessToken> = {
          type: "IAccessToken",
          value: {
            identity: { type: "cfa", email: "mail@mail.com", siret: "55327987900672" },
            scopes: [
              generateScope({
                schema: {
                  method: "post",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {},
              }),
              generateScope({
                schema: {
                  method: "get",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {
                  application: [applicationO1E1R1J1A1._id.toString()],
                },
              }),
            ],
          },
        }

        await expect(
          authorizationnMiddleware(
            {
              method: "post",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: applicationO1E1R1J1A1._id.toString(),
              },
            }
          )
        ).rejects.toThrow("Forbidden")

        await expect(
          authorizationnMiddleware(
            {
              method: "get",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: applicationO1E1R1J1A2._id.toString(),
              },
            }
          )
        ).rejects.toThrow("Forbidden")
      })
    })
    describe("when accessing user resource", () => {
      it("should allow when resource is present in token for same scope", async () => {
        const securityScheme: SecurityScheme = {
          auth: "cookie-session",
          access: "user:manage",
          resources: {
            user: [{ _id: { type: "params", key: "id" } }],
          },
        }
        const userWithType: UserWithType<"IAccessToken", IAccessToken> = {
          type: "IAccessToken",
          value: {
            identity: { type: "cfa", email: "mail@mail.com", siret: "55327987900672" },
            scopes: [
              generateScope({
                schema: {
                  method: "post",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {},
              }),
              generateScope({
                schema: {
                  method: "get",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {
                  user: [opcoUserO1U1._id.toString()],
                },
              }),
            ],
          },
        }

        await expect(
          authorizationnMiddleware(
            {
              method: "get",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: opcoUserO1U1._id.toString(),
              },
            }
          )
        ).resolves.toBe(undefined)
      })

      it("should deny when resource is not present in token for same scope", async () => {
        const securityScheme: SecurityScheme = {
          auth: "cookie-session",
          access: "user:manage",
          resources: {
            user: [{ _id: { type: "params", key: "id" } }],
          },
        }
        const userWithType: UserWithType<"IAccessToken", IAccessToken> = {
          type: "IAccessToken",
          value: {
            identity: { type: "cfa", email: "mail@mail.com", siret: "55327987900672" },
            scopes: [
              generateScope({
                schema: {
                  method: "post",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {},
              }),
              generateScope({
                schema: {
                  method: "get",
                  path: "/path/:id",
                  securityScheme: {
                    auth: "access-token",
                    access: null,
                    resources: {},
                  },
                },
                options: "all",
                resources: {
                  user: [opcoUserO1U1._id.toString()],
                },
              }),
            ],
          },
        }

        await expect(
          authorizationnMiddleware(
            {
              method: "post",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: opcoUserO1U1._id.toString(),
              },
            }
          )
        ).rejects.toThrow("Forbidden")

        await expect(
          authorizationnMiddleware(
            {
              method: "get",
              path: "/path/:id",
              securityScheme,
            },
            {
              user: userWithType,
              query: {},
              params: {
                id: opcoUserO1U2._id.toString(),
              },
            }
          )
        ).rejects.toThrow("Forbidden")
      })
    })
  })
})

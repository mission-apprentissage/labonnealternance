import { FastifyRequest } from "fastify"
import { ObjectId } from "mongodb"
import { extensions } from "shared/helpers/zodHelpers/zodPrimitives"
import { IApplication, ICredential, IJob, IRecruiter, IUserRecruteur, ZApplication, ZCredential, ZRecruiter, ZUserRecruteur } from "shared/models"
import { zObjectId } from "shared/models/common"
import { SecurityScheme } from "shared/routes/common.routes"
import { AccessPermission, AccessRessouces, Permission } from "shared/security/permissions"
import { beforeEach, beforeAll, describe, it, expect } from "vitest"
import { Fixture, Generator } from "zod-fixture"

import { Application, Credential, Recruiter, UserRecruteur } from "@/common/model"
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
  useMongo(true)

  beforeEach(() => {
    seed = 0
  })

  let adminUser: IUserRecruteur
  let opcoUserO1U1: IUserRecruteur
  let opcoUserO1U2: IUserRecruteur
  let cfaUserO1U3: IUserRecruteur
  let recruteurUserO1E1R1: IUserRecruteur
  let recruteurO1E1R1: IRecruiter
  let recruteurUserO1E1R2: IUserRecruteur
  let recruteurO1E1R2: IRecruiter
  let recruteurUserO1E2R1: IUserRecruteur
  let recruteurO1E2R1: IRecruiter
  let opcoUserO2U1: IUserRecruteur
  let cfaUserO2U2: IUserRecruteur
  let recruteurUserO2E1R1: IUserRecruteur
  let recruteurO2E1R1: IRecruiter
  let credentialO1: ICredential

  function getResourceAccessKey(resource: IUserRecruteur | IRecruiter | IJob, i: number): string {
    if (resource instanceof UserRecruteur) {
      return `userId${i}`
    }
    if (resource instanceof Recruiter) {
      return `recruiterId${i}`
    }

    return `jobId${i}`
  }

  function generateSecuritySchemeFixture(
    access: AccessPermission,
    ressources: ReadonlyArray<IUserRecruteur | IRecruiter | IJob>,
    location: "params" | "query"
  ): [SecurityScheme, Pick<FastifyRequest, "params" | "query">] {
    return [
      {
        auth: "cookie-session",
        access,
        ressources: ressources.reduce((acc, resource, i) => {
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

  beforeAll(async () => {
    // Here is the overall relation we will use to test permissions

    // OPCO #O1
    //  |--- OpcoUser #O1#U1
    //  |--- OpcoUser #O1#U2
    //  |--- CfaUser  #01#U3
    //  |--- Entreprise #O1#E1
    //       --> Recruteur #O1#E1#R1 --> Delegated #01#U3
    //           --> Job #O1#E1#R1#J1
    //               --> Application #O1#E1#R1#J1#A1
    //               --> Application #O1#E1#R1#J1#A2
    //           --> Job #O1#E1#R1#J2
    //               --> Application #O1#E1#R1#J2#A1
    //       --> Recruteur #O1#E1#R2
    //           --> Job #O1#E1#R2#J1
    //           --> Job #O1#E1#R2#J2
    //  |--- Entreprise #O1#E2
    //       --> Recruteur #O1#E2#R1
    //           --> Job #O1#E2#R1#J1
    // OPCO #O2
    //  |--- Entreprise #O2#E1
    //       --> Recruteur #O2#E1#R1
    //           --> Job #O2#E1#R1#J1
    //  |--- OpcoUser #O2#U1
    //  |--- CfaUser  #02#U2

    const CFA_SIRET = "80300515600044"
    const O1E1R1J1Id = new ObjectId()
    const O1E1R1J2Id = new ObjectId()
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
    cfaUserO1U3 = await createUserRecruteur({
      type: "CFA",
      first_name: "O1U3",
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
    await createApplication({
      job_id: O1E1R1J1Id.toString(),
      applicant_message_to_company: "#O1#E1#R1#J1#A1",
    })
    await createApplication({
      job_id: O1E1R1J1Id.toString(),
      applicant_message_to_company: "#O1#E1#R1#J1#A2",
    })
    await createApplication({
      job_id: O1E1R1J2Id.toString(),
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
      [{ job_description: "#O1#E1#R2#J1" }, { job_description: "#O1#E1#R2#J2" }]
    )

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
    cfaUserO2U2 = await createUserRecruteur({
      type: "CFA",
      scope: "#O2",
      first_name: "O2U2",
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
  })

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
              cfaUserO1U3,
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
              cfaUserO2U2,
              recruteurUserO2E1R1,
              recruteurO2E1R1,
              ...recruteurO2E1R1.jobs,
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
        it("on school from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUserO1U3], location)
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
        it("on recruiter from my Opco", async () => {
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
                  value: opcoUserO1U1,
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
        it("on user CFA from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUserO1U3], location)
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
        it("on school from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUserO1U3], location)
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
        it("on recruiter from my Opco", async () => {
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
        it("on user CFA from my Opco", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUserO1U3], location)
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
                  value: cfaUserO1U3,
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
                  value: cfaUserO1U3,
                },
                ...req,
              }
            )
          ).resolves.toBe(undefined)
        })
      })
      describe.each<[Permission]>([["user:manage"], ["school:manage"]])("I have %s permission", (permission) => {
        it("on myself", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUserO1U3], location)
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
                  value: cfaUserO1U3,
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
                  value: cfaUserO1U3,
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
                  value: cfaUserO1U3,
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
                  value: cfaUserO1U3,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["school:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on other schools", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUserO2U2], location)
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
                  value: cfaUserO1U3,
                },
                ...req,
              }
            )
          ).rejects.toThrow("Forbidden")
        })
      })

      describe.each<[Permission]>([["application:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on delegated recruiter", async () => {
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
                  value: cfaUserO1U3,
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
                  value: cfaUserO1U3,
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
                  value: cfaUserO1U3,
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
                  value: cfaUserO1U3,
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

      describe.each<[Permission]>([["user:manage"], ["school:manage"], ["admin"]])("I do not have %s permission", (permission) => {
        it("on schools", async () => {
          const [securityScheme, req] = generateSecuritySchemeFixture(permission, [cfaUserO1U3], location)
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
      ressources: {
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
      ressources: {
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
      ressources: {
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
      ressources: {},
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
})

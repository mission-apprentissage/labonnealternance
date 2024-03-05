import Boom from "boom"
import { FastifyRequest } from "fastify"
import { IApplication, ICredential, IJob, IRecruiter, IUserRecruteur } from "shared/models"
import { IUser2 } from "shared/models/user2.model"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { AccessPermission, AccessResourcePath, AdminRole, CfaRole, OpcoRole, PendingRecruiterRole, RecruiterRole, Role, UserWithType } from "shared/security/permissions"
import { assertUnreachable } from "shared/utils"
import { Primitive } from "type-fest"

import { Application, Recruiter, UserRecruteur } from "@/common/model"
import { getUserRecruteurById } from "@/services/userRecruteur.service"

import { controlUserState } from "../services/login.service"

import { getUserFromRequest } from "./authenticationService"

type Resources = {
  recruiters: Array<IRecruiter>
  jobs: Array<{ job: IJob; recruiter: IRecruiter } | null>
  users: Array<IUserRecruteur>
  applications: Array<{ application: IApplication; job: IJob; recruiter: IRecruiter } | null>
}

// Specify what we need to simplify mocking in tests
type IRequest = Pick<FastifyRequest, "user" | "params" | "query">

type NonTokenUserWithType = UserWithType<"IUser2", IUser2> | UserWithType<"ICredential", ICredential>

// TODO: Unit test access control
// TODO: job.delegations
// TODO: Unit schema access path properly defined (exists in Zod schema)

function getAccessResourcePathValue(path: AccessResourcePath, req: IRequest): any {
  const obj = req[path.type] as Record<string, Primitive>
  return obj[path.key]
}

async function getRecruitersResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["recruiters"]> {
  if (!schema.securityScheme.resources.recruiter) {
    return []
  }

  return (
    await Promise.all(
      schema.securityScheme.resources.recruiter.map(async (recruiterDef): Promise<IRecruiter[]> => {
        if ("_id" in recruiterDef) {
          const recruiterOpt = await Recruiter.findById(getAccessResourcePathValue(recruiterDef._id, req)).lean()
          return recruiterOpt ? [recruiterOpt] : []
        }
        if ("establishment_id" in recruiterDef) {
          return Recruiter.find({
            establishment_id: getAccessResourcePathValue(recruiterDef.establishment_id, req),
          }).lean()
        }
        if ("email" in recruiterDef && "establishment_siret" in recruiterDef) {
          return Recruiter.find({
            email: getAccessResourcePathValue(recruiterDef.email, req),
            establishment_siret: getAccessResourcePathValue(recruiterDef.establishment_siret, req),
          }).lean()
        }
        if ("opco" in recruiterDef) {
          return Recruiter.find({ opco: getAccessResourcePathValue(recruiterDef.opco, req) }).lean()
        }
        if ("cfa_delegated_siret" in recruiterDef) {
          return Recruiter.find({ cfa_delegated_siret: getAccessResourcePathValue(recruiterDef.cfa_delegated_siret, req) }).lean()
        }

        assertUnreachable(recruiterDef)
      })
    )
  ).flatMap((_) => _)
}

async function getJobsResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["jobs"]> {
  if (!schema.securityScheme.resources.job) {
    return []
  }

  return Promise.all(
    schema.securityScheme.resources.job.map(async (j) => {
      if ("_id" in j) {
        const id = getAccessResourcePathValue(j._id, req)
        const recruiter = await Recruiter.findOne({ "jobs._id": id }).lean()

        if (!recruiter) {
          return null
        }

        const job = await recruiter.jobs.find((j) => j._id.toString() === id.toString())

        if (!job) {
          return null
        }

        return { recruiter, job }
      }

      assertUnreachable(j)
    })
  )
}

async function getUserResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["users"]> {
  if (!schema.securityScheme.resources.user) {
    return []
  }

  return (
    await Promise.all(
      schema.securityScheme.resources.user.map(async (userDef) => {
        if ("_id" in userDef) {
          const userOpt = await getUserRecruteurById(getAccessResourcePathValue(userDef._id, req))
          return userOpt ? [userOpt] : []
        }
        if ("opco" in userDef) {
          return UserRecruteur.find({ opco: getAccessResourcePathValue(userDef.opco, req) }).lean()
        }

        assertUnreachable(userDef)
      })
    )
  ).flatMap((_) => _)
}

async function getApplicationResouce<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["applications"]> {
  if (!schema.securityScheme.resources.application) {
    return []
  }

  return Promise.all(
    schema.securityScheme.resources.application.map(async (u) => {
      if ("_id" in u) {
        const id = getAccessResourcePathValue(u._id, req)
        const application = await Application.findById(id).lean()

        if (!application || !application.job_id) return null

        const jobId = application.job_id

        const recruiter = await Recruiter.findOne({ "jobs._id": jobId }).lean()

        if (!recruiter) {
          return null
        }

        const job = recruiter.jobs.find((j) => j._id.toString() === jobId.toString())

        if (!job) {
          return null
        }

        return { application, recruiter, job }
      }

      assertUnreachable(u)
    })
  )
}

export async function getResources<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources> {
  const [recruiters, jobs, users, applications] = await Promise.all([
    getRecruitersResource(schema, req),
    getJobsResource(schema, req),
    getUserResource(schema, req),
    getApplicationResouce(schema, req),
  ])

  return {
    recruiters,
    jobs,
    users,
    applications,
  }
}

export function getUserRole(userWithType: NonTokenUserWithType): Role | null {
  if (userWithType.type === "ICredential") {
    return OpcoRole
  }
  const userState = controlUserState(userWithType.value.status)

  switch (userWithType.value.type) {
    case "ADMIN":
      return AdminRole
    case "CFA":
      return CfaRole
    case "ENTREPRISE":
      if (userState.error) {
        if (userState.reason !== "VALIDATION") throw Boom.internal("Unexpected state during user role validation")
        return PendingRecruiterRole
      } else {
        return RecruiterRole
      }
    case "OPCO":
      return OpcoRole
    default:
      return assertUnreachable(userWithType.value.type)
  }
}

function canAccessRecruiter(userWithType: NonTokenUserWithType, resource: Resources["recruiters"][number]): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return resource.opco === userWithType.value.organisation
  }

  const user = userWithType.value
  switch (user.type) {
    case "ADMIN":
      return true
    case "ENTREPRISE":
      return resource.establishment_id === user.establishment_id
    case "CFA":
      return resource.cfa_delegated_siret === user.establishment_siret
    case "OPCO":
      return resource.opco === user.scope
    default:
      assertUnreachable(user.type)
  }
}

function canAccessJob(userWithType: NonTokenUserWithType, resource: Resources["jobs"][number]): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return resource.recruiter.opco === userWithType.value.organisation
  }

  const user = userWithType.value
  switch (user.type) {
    case "ADMIN":
      return true
    case "ENTREPRISE":
      return resource.recruiter.establishment_id === user.establishment_id
    case "CFA":
      return resource.recruiter.cfa_delegated_siret === user.establishment_siret
    case "OPCO":
      return resource.recruiter.opco === user.scope
    default:
      assertUnreachable(user.type)
  }
}

function canAccessUser(userWithType: NonTokenUserWithType, resource: Resources["users"][number]): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return resource.type === "OPCO" && resource.scope === userWithType.value.organisation
  }

  if (resource._id.toString() === userWithType.value._id.toString()) {
    return true
  }

  const user = userWithType.value
  switch (user.type) {
    case "ADMIN":
      return true
    case "ENTREPRISE":
      return resource._id.toString() === user._id.toString()
    case "CFA":
      return resource._id.toString() === user._id.toString()
    case "OPCO":
      return (resource.type === "OPCO" && resource._id === user._id) || (resource.type === "ENTREPRISE" && resource.opco === user.scope)
    default:
      assertUnreachable(user.type)
  }
}

function canAccessApplication(userWithType: NonTokenUserWithType, resource: Resources["applications"][number]): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return false
  }

  const user = userWithType.value
  switch (user.type) {
    case "ADMIN":
      return true
    case "ENTREPRISE": {
      if (resource.application.job_origin === "matcha") {
        return resource.recruiter.establishment_id === userWithType.value.establishment_id
      }

      return false
    }
    case "CFA":
      return false
    case "OPCO":
      return false
    default:
      assertUnreachable(user.type)
  }
}

export function isAuthorized(access: AccessPermission, userWithType: NonTokenUserWithType, role: Role | null, resources: Resources): boolean {
  if (typeof access === "object") {
    if ("some" in access) {
      return access.some.some((a) => isAuthorized(a, userWithType, role, resources))
    }

    if ("every" in access) {
      return access.every.every((a) => isAuthorized(a, userWithType, role, resources))
    }

    assertUnreachable(access)
  }

  // Role is null for access token but we have permission
  if (role && !role.permissions.includes(access)) {
    return false
  }

  switch (access) {
    case "recruiter:manage":
    case "recruiter:add_job":
      return resources.recruiters.every((recruiter) => canAccessRecruiter(userWithType, recruiter))

    case "job:manage":
      return resources.jobs.every((job) => canAccessJob(userWithType, job))

    case "school:manage":
      // School is actually the UserRecruteur
      return resources.users.every((user) => canAccessUser(userWithType, user))
    case "application:manage":
      return resources.applications.every((application) => canAccessApplication(userWithType, application))
    case "user:validate":
    case "user:manage":
      return resources.users.every((user) => canAccessUser(userWithType, user))
    case "admin":
      // Admin should already have been approved, otherwise you cannot access to admin
      return false
    default:
      assertUnreachable(access)
  }
}

export async function authorizationMiddleware<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(schema: S, req: IRequest) {
  if (!schema.securityScheme) {
    throw Boom.internal(`authorizationMiddleware: route doesn't have security scheme`, { method: schema.method, path: schema.path })
  }

  if (schema.securityScheme.access === null) {
    return
  }

  const userWithType = getUserFromRequest(req, schema)

  if (userWithType.type === "IUser2" && userWithType.value.type === "ADMIN") {
    return
  }
  if (userWithType.type === "IAccessToken") {
    // authorization check has already been done in authentication
    return
  }

  const resources = await getResources(schema, req)
  const role = getUserRole(userWithType)

  if (!isAuthorized(schema.securityScheme.access, userWithType, role, resources)) {
    throw Boom.forbidden()
  }
}

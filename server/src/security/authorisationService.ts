import Boom from "boom"
import { FastifyRequest } from "fastify"
import { IApplication, IJob, IRecruiter, IUserRecruteur } from "shared/models"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { AccessPermission, AccessResourcePath, AdminRole, CfaRole, OpcoRole, RecruiterRole, Role } from "shared/security/permissions"
import { assertUnreachable } from "shared/utils"
import { Primitive } from "type-fest"

import { Application, Recruiter, UserRecruteur } from "@/common/model"

import { getAccessTokenScope } from "./accessTokenService"
import { IUserWithType, getUserFromRequest } from "./authenticationService"

type Resources = {
  recruiters: Array<IRecruiter>
  jobs: Array<{ job: IJob; recruiter: IRecruiter } | null>
  users: Array<IUserRecruteur>
  applications: Array<{ application: IApplication; job: IJob; recruiter: IRecruiter } | null>
}

// Specify what we need to simplify mocking in tests
type IRequest = Pick<FastifyRequest, "user" | "params" | "query">

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
          const userOpt = await UserRecruteur.findById(getAccessResourcePathValue(userDef._id, req)).lean()
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

export function getUserRole(userWithType: IUserWithType): Role | null {
  if (userWithType.type === "ICredential") {
    return OpcoRole
  }

  if (userWithType.type === "IAccessToken") {
    return null
  }

  switch (userWithType.value.type) {
    case "ADMIN":
      return AdminRole
    case "CFA":
      return CfaRole
    case "ENTREPRISE":
      return RecruiterRole
    case "OPCO":
      return OpcoRole
    default:
      return assertUnreachable(userWithType.value.type)
  }
}

function canAccessRecruiter<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(
  userWithType: IUserWithType,
  resource: Resources["recruiters"][number],
  schema: S
): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return resource.opco === userWithType.value.organisation
  }

  if (userWithType.type === "IAccessToken") {
    const scope = getAccessTokenScope(userWithType.value, schema)?.resources.recruiter?.find((id) => id === resource._id.toString()) ?? null
    return scope !== null
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

function canAccessJob<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(userWithType: IUserWithType, resource: Resources["jobs"][number], schema: S): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return resource.recruiter.opco === userWithType.value.organisation
  }

  if (userWithType.type === "IAccessToken") {
    const scope = getAccessTokenScope(userWithType.value, schema)?.resources.job?.find((id) => id === resource.job._id.toString()) ?? null
    return scope !== null
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

function canAccessUser<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(
  userWithType: IUserWithType,
  resource: Resources["users"][number],
  schema: S
): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return resource.type === "OPCO" && resource.scope === userWithType.value.organisation
  }

  if (userWithType.type === "IAccessToken") {
    const scope = getAccessTokenScope(userWithType.value, schema)?.resources.user?.find((id) => id === resource._id.toString()) ?? null
    return scope !== null
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

function canAccessApplication<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(
  userWithType: IUserWithType,
  resource: Resources["applications"][number],
  schema: S
): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return false
  }

  if (userWithType.type === "IAccessToken") {
    const scope = getAccessTokenScope(userWithType.value, schema)?.resources.application?.find((id) => id === resource.application._id.toString()) ?? null
    return scope !== null
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

export function isAuthorized<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(
  access: AccessPermission,
  userWithType: IUserWithType,
  role: Role | null,
  resources: Resources,
  schema: S
): boolean {
  if (typeof access === "object") {
    if ("some" in access) {
      return access.some.some((a) => isAuthorized(a, userWithType, role, resources, schema))
    }

    if ("every" in access) {
      return access.every.every((a) => isAuthorized(a, userWithType, role, resources, schema))
    }

    assertUnreachable(access)
  }

  // Role is null for access token but we have permission
  if (role && !role.permissions.includes(access)) {
    return false
  }

  switch (access) {
    case "recruiter:manage":
    case "recruiter:validate":
    case "recruiter:add_job":
      return resources.recruiters.every((r) => canAccessRecruiter(userWithType, r, schema))

    case "job:manage":
      return resources.jobs.every((r) => canAccessJob(userWithType, r, schema))

    case "school:manage":
      // School is actually the UserRecruteur
      return resources.users.every((r) => canAccessUser(userWithType, r, schema))
    case "application:manage":
      return resources.applications.every((r) => canAccessApplication(userWithType, r, schema))
    case "user:manage":
      return resources.users.every((r) => canAccessUser(userWithType, r, schema))
    case "admin":
      // Admin should already have been approved, otherwise you cannot access to admin
      return false
    default:
      assertUnreachable(access)
  }
}

export async function authorizationnMiddleware<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(schema: S, req: IRequest) {
  if (!schema.securityScheme) {
    throw Boom.internal(`authorizationnMiddleware: route doesn't have security scheme`, { method: schema.method, path: schema.path })
  }

  const userWithType = getUserFromRequest(req, schema)

  if (userWithType.type === "IUserRecruteur" && userWithType.value.type === "ADMIN") {
    return
  }

  if (schema.securityScheme.access === null) {
    return
  }

  const resources = await getResources(schema, req)
  const role = getUserRole(userWithType)

  if (!isAuthorized(schema.securityScheme.access, userWithType, role, resources, schema)) {
    throw Boom.forbidden()
  }
}

import Boom from "boom"
import { FastifyRequest } from "fastify"
import { ObjectId } from "mongodb"
import { PathParam, QueryString } from "shared/helpers/generateUri"
import { IApplication, ICredential, IJob, IRecruiter, IUserRecruteur } from "shared/models"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { AccessPermission, AccessResourcePath, AdminRole, CfaRole, OpcoRole, RecruiterRole, Role, UserWithType } from "shared/security/permissions"
import { assertUnreachable } from "shared/utils"
import { Primitive } from "type-fest"

import { Recruiter, UserRecruteur, Application } from "@/common/model"

import { IAccessToken, SchemaWithSecurity, getAccessTokenScope } from "./accessTokenService"
import { getUserFromRequest } from "./authenticationService"

type Ressources = {
  recruiters: Array<IRecruiter>
  jobs: Array<{ job: IJob; recruiter: IRecruiter }>
  users: Array<IUserRecruteur>
  applications: Array<{ application: IApplication; job: IJob; recruiter: IRecruiter }>
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

async function getRecruitersResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Ressources["recruiters"]> {
  if (!schema.securityScheme.ressources.recruiter) {
    return []
  }

  return (
    await Promise.all(
      schema.securityScheme.ressources.recruiter.map(async (recruiterDef): Promise<IRecruiter[]> => {
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

        assertUnreachable(recruiterDef)
      })
    )
  ).flatMap((_) => _)
}

async function getJobsResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Ressources["jobs"]> {
  if (!schema.securityScheme.ressources.job) {
    return []
  }

  return (
    await Promise.all(
      schema.securityScheme.ressources.job.map(async (j) => {
        if ("_id" in j) {
          const id = getAccessResourcePathValue(j._id, req)
          const recruiter = await Recruiter.findOne({ "jobs._id": id }).lean()

          if (!recruiter) {
            return []
          }

          const job = await recruiter.jobs.find((j) => j._id.toString() === id.toString())

          if (!job) {
            return []
          }

          return [{ recruiter, job }]
        }

        assertUnreachable(j)
      })
    )
  ).flatMap((_) => _)
}

async function getUserResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Ressources["users"]> {
  if (!schema.securityScheme.ressources.user) {
    return []
  }

  return (
    await Promise.all(
      schema.securityScheme.ressources.user.map(async (userDef) => {
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

async function getApplicationResouce<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Ressources["applications"]> {
  if (!schema.securityScheme.ressources.application) {
    return []
  }

  return (
    await Promise.all(
      schema.securityScheme.ressources.application.map(async (u) => {
        if ("_id" in u) {
          const id = getAccessResourcePathValue(u._id, req)
          const application = await Application.findById(id).lean()

          if (!application || !application.job_id) return []

          const jobId = application.job_id

          const recruiter = await Recruiter.findOne({ "jobs._id": jobId }).lean()

          if (!recruiter) {
            return []
          }

          const job = recruiter.jobs.find((j) => j._id.toString() === jobId.toString())

          if (!job) {
            return []
          }

          return [{ application, recruiter, job }]
        }

        assertUnreachable(u)
      })
    )
  ).flatMap((_) => _)
}

export async function getResources<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Ressources> {
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

export function getUserRole(userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>): Role {
  if (userWithType.type === "ICredential") {
    return OpcoRole
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

function canAccessRecruiter(
  userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>,
  resource: Ressources["recruiters"][number]
): boolean {
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

function canAccessJob(userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>, resource: Ressources["jobs"][number]): boolean {
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

function canAccessUser(userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>, resource: Ressources["users"][number]): boolean {
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

function canAccessApplication(
  userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>,
  resource: Ressources["applications"][number]
): boolean {
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

export function isAuthorizedUser(
  access: AccessPermission,
  userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>,
  resources: Ressources
): boolean {
  if (typeof access === "object") {
    if ("some" in access) {
      return access.some.some((a) => isAuthorizedUser(a, userWithType, resources))
    }

    if ("every" in access) {
      return access.every.every((a) => isAuthorizedUser(a, userWithType, resources))
    }

    assertUnreachable(access)
  }

  const role = getUserRole(userWithType)
  if (!role.permissions.includes(access)) {
    return false
  }

  if (role.permissions.includes("admin")) {
    return true
  }

  switch (access) {
    case "recruiter:manage":
    case "recruiter:validate":
    case "recruiter:add_job":
      return resources.recruiters.every((r) => canAccessRecruiter(userWithType, r))

    case "job:manage":
      return resources.jobs.every((r) => canAccessJob(userWithType, r))

    case "school:manage":
      // School is actually the UserRecruteur
      return resources.users.every((r) => canAccessUser(userWithType, r))
    case "application:manage":
      return resources.applications.every((r) => canAccessApplication(userWithType, r))
    case "user:manage":
      return resources.users.every((r) => canAccessUser(userWithType, r))
    case "admin":
      // Admin doesn't have specific ressources. We just need to have the permission
      return true
    default:
      assertUnreachable(access)
  }
}

function canAccessRessource(allowedIds: ReadonlyArray<string> | undefined, requiredResources: Array<{ _id: ObjectId }>) {
  const set: Set<string> = new Set(allowedIds)

  for (const resource of requiredResources) {
    if (!set.has(resource._id.toString())) {
      return false
    }
  }

  return true
}

export function isAuthorizedToken<S extends SchemaWithSecurity>(
  token: IAccessToken,
  resources: Ressources,
  schema: S,
  params: PathParam | undefined,
  querystring: QueryString | undefined
): boolean {
  const scope = getAccessTokenScope(token, schema, params, querystring)

  const keys = Object.keys(resources) as Array<keyof Ressources>
  for (const key of keys) {
    switch (key) {
      case "jobs": {
        if (
          !canAccessRessource(
            scope?.resources.job,
            resources.jobs.map(({ job }) => job)
          )
        ) {
          return false
        }
        break
      }
      case "recruiters": {
        if (!canAccessRessource(scope?.resources.recruiter, resources.recruiters)) {
          return false
        }

        break
      }
      case "users": {
        if (!canAccessRessource(scope?.resources.user, resources.users)) {
          return false
        }
        break
      }
      case "applications":
        if (
          !canAccessRessource(
            scope?.resources.application,
            resources.applications.map(({ application }) => application)
          )
        ) {
          return false
        }
        break
      default:
        assertUnreachable(key)
    }
  }
  if ("users" in resources) {
    const allowedUserIds: Set<string> = new Set(scope?.resources.user ?? [])

    for (const requiredUser of resources.users) {
      if (!allowedUserIds.has(requiredUser._id.toString())) {
        return false
      }
    }
  }

  return true
}

export async function authorizationnMiddleware<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(schema: S, req: IRequest) {
  if (!schema.securityScheme) {
    throw Boom.internal(`authorizationnMiddleware: route doesn't have security scheme`, { method: schema.method, path: schema.path })
  }

  const userWithType = getUserFromRequest(req, schema)

  // Skip loading ressources for admins
  if (userWithType.type === "IUserRecruteur" && userWithType.value.type === "ADMIN") {
    return
  }

  if (schema.securityScheme.access === null) {
    return
  }

  const resources = await getResources(schema, req)

  const isAuthorized =
    userWithType.type === "IAccessToken"
      ? isAuthorizedToken(userWithType.value, resources, schema, req.params as PathParam, req.query as QueryString)
      : isAuthorizedUser(schema.securityScheme.access, userWithType, resources)

  if (!isAuthorized) {
    throw Boom.forbidden()
  }
}

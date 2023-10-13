import Boom from "boom"
import { FastifyRequest } from "fastify"
import { ICredential, IJob, IRecruiter, IUserRecruteur } from "shared/models"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { AccessPermission, AccessResourcePath, AdminRole, CfaRole, OpcoRole, RecruiterRole, Role, UserWithType } from "shared/security/permissions"

import { Recruiter, UserRecruteur } from "@/common/model"

import { getUserFromRequest } from "./authenticationService"

type Ressouces = {
  recruiters: Array<IRecruiter | null>
  jobs: Array<{ job: IJob; recruiter: IRecruiter } | null>
  users: Array<IUserRecruteur | null>
}

function assertUnreachable(_x: never): never {
  throw new Error("Didn't expect to get here")
}

function getAccessResourcePathValue(path: AccessResourcePath, req: FastifyRequest): any {
  const accessParts = path.split(".")
  let value = req

  for (const part of accessParts) {
    value = value[part]
  }

  return value
}

async function getRecruitersResource<S extends IRouteSchema & WithSecurityScheme>(schema: S, req: FastifyRequest): Promise<Ressouces["recruiters"]> {
  if (!schema.securityScheme.ressources.recruiter) {
    return []
  }

  return Promise.all(
    schema.securityScheme.ressources.recruiter.map(async (r): Promise<IRecruiter | null> => {
      if ("_id" in r) {
        return await Recruiter.findById(getAccessResourcePathValue(r._id, req)).lean()
      }

      if ("establishment_id" in r) {
        return await Recruiter.findOne({
          establishment_id: getAccessResourcePathValue(r.establishment_id, req),
        }).lean()
      }

      assertUnreachable(r)
    })
  )
}

async function getJobsResource<S extends IRouteSchema & WithSecurityScheme>(schema: S, req: FastifyRequest): Promise<Ressouces["jobs"]> {
  if (!schema.securityScheme.ressources.job) {
    return []
  }

  return Promise.all(
    schema.securityScheme.ressources.job.map(async (j) => {
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

async function getUserResource<S extends IRouteSchema & WithSecurityScheme>(schema: S, req: FastifyRequest): Promise<Ressouces["users"]> {
  if (!schema.securityScheme.ressources.user) {
    return []
  }

  return Promise.all(
    schema.securityScheme.ressources.user.map(async (u) => {
      if (u === "self") {
        // We can ignore self, as it will always be true
        return null
      }

      if ("_id" in u) {
        const id = getAccessResourcePathValue(u._id, req)
        return await UserRecruteur.findById(id).lean()
      }

      assertUnreachable(u)
    })
  )
}

async function getResources<S extends IRouteSchema & WithSecurityScheme>(schema: S, req: FastifyRequest): Promise<Ressouces> {
  const [recruiters, jobs, users] = await Promise.all([getRecruitersResource(schema, req), getJobsResource(schema, req), getUserResource(schema, req)])

  return {
    recruiters,
    jobs,
    users,
  }
}

function getUserRole(userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>): Role {
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
  resource: Ressouces["recruiters"][number]
): boolean {
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
      return resource.opco === user.opco
    default:
      assertUnreachable(user.type)
  }
}

function canAccessJob(userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>, resource: Ressouces["jobs"][number]): boolean {
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
      return resource.recruiter.opco === user.opco
    default:
      assertUnreachable(user.type)
  }
}

function canAccessUser(userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>, resource: Ressouces["users"][number]): boolean {
  if (resource === null) {
    return true
  }

  if (userWithType.type === "ICredential") {
    return resource.type === "OPCO" && resource.scope === userWithType.value.organisation
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
      return resource.type === "OPCO" && resource.scope === user.opco
    default:
      assertUnreachable(user.type)
  }
}

function isAuthorized(
  access: AccessPermission,
  userWithType: UserWithType<"IUserRecruteur", IUserRecruteur> | UserWithType<"ICredential", ICredential>,
  role: Role,
  resources: Ressouces
): boolean {
  if (typeof access === "object") {
    if ("some" in access) {
      return access.some.some((a) => isAuthorized(a, userWithType, role, resources))
    }

    if ("every" in access) {
      return access.every.every((a) => isAuthorized(a, userWithType, role, resources))
    }

    assertUnreachable(access)
  }

  if (!role.permissions.includes(access)) {
    return false
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
      throw new Error("Not implemented")
    case "user:manage":
      return resources.users.every((r) => canAccessUser(userWithType, r))
    case "admin":
      // Admin should already have been approved
      return false
    default:
      assertUnreachable(access)
  }
}

export async function authorizationnMiddleware<S extends IRouteSchema & WithSecurityScheme>(schema: S, req: FastifyRequest) {
  if (!schema.securityScheme) {
    throw Boom.internal(`authorizationnMiddleware: route doesn't have security scheme`, { method: schema.method, path: schema.path })
  }

  const userWithType = getUserFromRequest(req, schema)

  if (userWithType.type === "IUserRecruteur" && userWithType.value.type === "ADMIN") {
    return
  }

  const resources = await getResources(schema, req)
  const role = getUserRole(userWithType)

  if (schema.securityScheme.access === null) {
    return
  }

  if (!isAuthorized(schema.securityScheme.access, userWithType, role, resources)) {
    throw Boom.forbidden()
  }
}

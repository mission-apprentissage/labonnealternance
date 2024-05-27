import Boom from "boom"
import { FastifyRequest } from "fastify"
import { ADMIN, CFA, ENTREPRISE, OPCOS } from "shared/constants/recruteur"
import { ComputedUserAccess, IApplication, IJob, IRecruiter } from "shared/models"
import { ICFA } from "shared/models/cfa.model"
import { IEntreprise } from "shared/models/entreprise.model"
import { AccessEntityType, IRoleManagement } from "shared/models/roleManagement.model"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { AccessPermission, AccessResourcePath } from "shared/security/permissions"
import { assertUnreachable, parseEnum } from "shared/utils"
import { Primitive } from "type-fest"

import { Application, Cfa, Entreprise, Recruiter, UserWithAccount } from "@/common/model"
import { ObjectId } from "@/common/mongodb"
import { getComputedUserAccess, getGrantedRoles } from "@/services/roleManagement.service"
import { getUserWithAccountByEmail, isUserDisabled, isUserEmailChecked } from "@/services/userWithAccount.service"

import { getUserFromRequest } from "./authenticationService"

type RecruiterResource = { recruiter: IRecruiter } & ({ type: "ENTREPRISE"; entreprise: IEntreprise } | { type: "CFA"; cfa: ICFA })
type JobResource = { job: IJob; recruiterResource: RecruiterResource }
type ApplicationResource = { application: IApplication; jobResource?: JobResource; applicantId?: string }
type EntrepriseResource = { entreprise: IEntreprise }

type Resources = {
  users: Array<{ _id: string }>
  recruiters: Array<RecruiterResource>
  jobs: Array<JobResource>
  applications: Array<ApplicationResource>
  entreprises: Array<EntrepriseResource>
}
export type ResourceIds = {
  recruiters?: string[]
  jobs?: Array<{ job: string; recruiter: string | null } | null>
  users?: Array<string>
  applications?: Array<{ application: string; job: string; recruiter: string } | null>
}

// Specify what we need to simplify mocking in tests
type IRequest = Pick<FastifyRequest, "user" | "params" | "query" | "authorizationContext">

// TODO: Unit test access control
// TODO: job.delegations
// TODO: Unit schema access path properly defined (exists in Zod schema)

function getAccessResourcePathValue(path: AccessResourcePath, req: IRequest): any {
  const obj = req[path.type] as Record<string, Primitive>
  return obj[path.key]
}

const recruiterToRecruiterResource = async (recruiter: IRecruiter): Promise<RecruiterResource> => {
  const { cfa_delegated_siret, establishment_siret } = recruiter
  if (cfa_delegated_siret) {
    const cfa = await Cfa.findOne({ siret: cfa_delegated_siret }).lean()
    if (!cfa) {
      throw Boom.internal(`could not find cfa for recruiter with id=${recruiter._id}`)
    }
    return { recruiter, type: CFA, cfa }
  } else {
    const entreprise = await Entreprise.findOne({ siret: establishment_siret }).lean()
    if (!entreprise) {
      throw Boom.internal(`could not find entreprise for recruiter with id=${recruiter._id}`)
    }
    return { recruiter, type: ENTREPRISE, entreprise }
  }
}

const jobToJobResource = async (job: IJob, recruiter: IRecruiter): Promise<JobResource> => {
  const recruiterResource = await recruiterToRecruiterResource(recruiter)
  return { job, recruiterResource }
}

async function getRecruitersResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["recruiters"]> {
  if (!schema.securityScheme.resources.recruiter) {
    return []
  }

  const recruiters: IRecruiter[] = (
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
  return (await Promise.all(recruiters.map(recruiterToRecruiterResource))).flatMap((_) => (_ ? [_] : []))
}

async function getJobsResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["jobs"]> {
  if (!schema.securityScheme.resources.job) {
    return []
  }

  return (
    await Promise.all(
      schema.securityScheme.resources.job.map(async (jobDef): Promise<JobResource | null> => {
        if ("_id" in jobDef) {
          const id = getAccessResourcePathValue(jobDef._id, req)
          const recruiter = await Recruiter.findOne({ "jobs._id": id }).lean()

          if (!recruiter) {
            return null
          }

          const job = await recruiter.jobs.find((j) => j._id.toString() === id.toString())

          if (!job) {
            return null
          }
          return jobToJobResource(job, recruiter)
        }

        assertUnreachable(jobDef)
      })
    )
  ).flatMap((_) => (_ ? [_] : []))
}

async function getUserResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["users"]> {
  if (!schema.securityScheme.resources.user) {
    return []
  }

  return (
    await Promise.all(
      schema.securityScheme.resources.user.map(async (userDef) => {
        if ("_id" in userDef) {
          const userOpt = await UserWithAccount.findOne({ _id: getAccessResourcePathValue(userDef._id, req) }).lean()
          return userOpt ? { _id: userOpt._id.toString() } : null
        }
        assertUnreachable(userDef)
      })
    )
  ).flatMap((_) => (_ ? [_] : []))
}

async function getApplicationResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["applications"]> {
  if (!schema.securityScheme.resources.application) {
    return []
  }

  const results: (ApplicationResource | null)[] = await Promise.all(
    schema.securityScheme.resources.application.map(async (applicationDef): Promise<ApplicationResource | null> => {
      if ("_id" in applicationDef) {
        const id = getAccessResourcePathValue(applicationDef._id, req)
        const application = await Application.findById(id).lean()

        if (!application) return null
        const { job_id } = application
        if (!job_id) {
          return { application }
        }
        const recruiter = await Recruiter.findOne({ "jobs._id": job_id }).lean()
        if (!recruiter) {
          return { application }
        }
        const job = recruiter.jobs.find((job) => job._id.toString() === job_id)
        if (!job) {
          return { application }
        }
        const jobResource = await jobToJobResource(job, recruiter)
        const user = await getUserWithAccountByEmail(application.applicant_email)
        return { application, jobResource, applicantId: user?._id.toString() }
      }

      assertUnreachable(applicationDef)
    })
  )
  return results.flatMap((_) => (_ ? [_] : []))
}

async function getEntrepriseResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["entreprises"]> {
  if (!schema.securityScheme.resources.entreprise) {
    return []
  }

  const results: (EntrepriseResource | null)[] = await Promise.all(
    schema.securityScheme.resources.entreprise.map(async (entrepriseDef): Promise<EntrepriseResource | null> => {
      if ("siret" in entrepriseDef) {
        const siret = getAccessResourcePathValue(entrepriseDef.siret, req)
        const entreprise = await Entreprise.findOne({ siret }).lean()
        return entreprise ? { entreprise } : null
      } else if ("_id" in entrepriseDef) {
        const id = getAccessResourcePathValue(entrepriseDef._id, req)
        try {
          new ObjectId(id)
        } catch (e) {
          return null
        }
        const entreprise = await Entreprise.findById(id).lean()
        return entreprise ? { entreprise } : null
      }

      assertUnreachable(entrepriseDef)
    })
  )
  return results.flatMap((_) => (_ ? [_] : []))
}

async function getResources<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources> {
  const [recruiters, jobs, users, applications, entreprises] = await Promise.all([
    getRecruitersResource(schema, req),
    getJobsResource(schema, req),
    getUserResource(schema, req),
    getApplicationResource(schema, req),
    getEntrepriseResource(schema, req),
  ])

  return {
    recruiters,
    jobs,
    users,
    applications,
    entreprises,
  }
}

function canAccessRecruiter(userAccess: ComputedUserAccess, resource: RecruiterResource): boolean {
  const recruiterOpco = parseEnum(OPCOS, resource.recruiter.opco ?? null)
  if (recruiterOpco && userAccess.opcos.includes(recruiterOpco)) {
    return true
  }
  if (resource.type === ENTREPRISE) {
    return userAccess.entreprises.includes(resource.entreprise._id.toString())
  } else if (resource.type === CFA) {
    return userAccess.cfas.includes(resource.cfa._id.toString())
  }
  return false
}

function canAccessJob(userAccess: ComputedUserAccess, resource: JobResource): boolean {
  return canAccessRecruiter(userAccess, resource.recruiterResource)
}

function canAccessUser(userAccess: ComputedUserAccess, resource: Resources["users"][number]): boolean {
  if (userAccess.opcos.length) {
    return true
  }
  return userAccess.users.includes(resource._id)
}

function canAccessApplication(userAccess: ComputedUserAccess, resource: ApplicationResource): boolean {
  const { jobResource, applicantId } = resource
  // TODO ajout de granularité pour les accès candidat et recruteur
  return (jobResource && canAccessJob(userAccess, jobResource)) || (applicantId ? canAccessUser(userAccess, { _id: applicantId }) : false)
}

function canAccessEntreprise(userAccess: ComputedUserAccess, resource: EntrepriseResource): boolean {
  const { entreprise } = resource
  const entrepriseOpco = parseEnum(OPCOS, entreprise.opco)
  return userAccess.entreprises.includes(entreprise._id.toString()) || Boolean(entrepriseOpco && userAccess.opcos.includes(entrepriseOpco))
}

function isAuthorized(access: AccessPermission, userAccess: ComputedUserAccess, resources: Resources): boolean {
  if (typeof access === "object") {
    if ("some" in access) {
      return access.some.some((permission) => isAuthorized(permission, userAccess, resources))
    } else if ("every" in access) {
      return access.every.every((permission) => isAuthorized(permission, userAccess, resources))
    } else {
      assertUnreachable(access)
    }
  }
  return (
    resources.recruiters.every((recruiter) => canAccessRecruiter(userAccess, recruiter)) &&
    resources.jobs.every((job) => canAccessJob(userAccess, job)) &&
    resources.applications.every((application) => canAccessApplication(userAccess, application)) &&
    resources.users.every((user) => canAccessUser(userAccess, user)) &&
    resources.entreprises.every((entreprise) => canAccessEntreprise(userAccess, entreprise))
  )
}

export async function authorizationMiddleware<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(schema: S, req: IRequest) {
  if (!schema.securityScheme) {
    throw Boom.internal(`authorizationMiddleware: route doesn't have security scheme`, { method: schema.method, path: schema.path })
  }

  const requestedAccess = schema.securityScheme.access

  if (requestedAccess === null) {
    return
  }

  const userWithType = getUserFromRequest(req, schema)
  const userType = userWithType.type

  if (userType === "IAccessToken") {
    // authorization check has already been done in authentication
    return
  }
  let grantedRoles: IRoleManagement[] = []
  if (userType === "IUser2") {
    const user = userWithType.value
    if (!isUserEmailChecked(user)) {
      throw Boom.forbidden("l'email doit être validé")
    }
    if (isUserDisabled(user)) {
      throw Boom.forbidden("user désactivé")
    }
    const { _id } = user
    grantedRoles = await getGrantedRoles(_id.toString())
    const isAdmin = grantedRoles.some((role) => role.authorized_type === AccessEntityType.ADMIN)
    if (isAdmin) {
      return
    }
    if (!grantedRoles.length) {
      throw Boom.forbidden("aucun role")
    }
  }

  if (requestedAccess === "admin") {
    throw Boom.forbidden("admin required")
  }

  const resources = await getResources(schema, req)

  if (userType === "ICredential") {
    const { organisation } = userWithType.value
    if (organisation.toLowerCase() === ADMIN.toLowerCase()) {
      return
    }
    const opco = parseEnum(OPCOS, organisation)
    const userAccess: ComputedUserAccess = {
      admin: false,
      users: [],
      cfas: [],
      entreprises: [],
      opcos: opco ? [opco] : [],
    }
    if (!isAuthorized(requestedAccess, userAccess, resources)) {
      throw Boom.forbidden("non autorisé")
    }
  } else if (userType === "IUser2") {
    const { _id } = userWithType.value
    const userAccess: ComputedUserAccess = getComputedUserAccess(_id.toString(), grantedRoles)
    if (!isAuthorized(requestedAccess, userAccess, resources)) {
      throw Boom.forbidden("non autorisé")
    }
  } else {
    assertUnreachable(userType)
  }
}

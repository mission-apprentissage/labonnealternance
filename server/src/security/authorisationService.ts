import { forbidden, internal } from "@hapi/boom"
import { FastifyRequest } from "fastify"
import { ObjectId } from "mongodb"
import { ADMIN, CFA, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import { ComputedUserAccess, IApplication, IJob, IRecruiter, IUserWithAccount } from "shared/models"
import { ICFA } from "shared/models/cfa.model"
import { IEntreprise } from "shared/models/entreprise.model"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { AccessEntityType, IRoleManagement } from "shared/models/roleManagement.model"
import { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import { AccessPermission, AccessResourcePath } from "shared/security/permissions"
import { assertUnreachable, parseEnum } from "shared/utils"
import { Primitive } from "type-fest"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getComputedUserAccess, getGrantedRoles } from "@/services/roleManagement.service"
import { getUserWithAccountByEmail, isUserDisabled, isUserEmailChecked } from "@/services/userWithAccount.service"

import { getUserFromRequest } from "./authenticationService"

type RecruiterResource = { recruiter: IRecruiter } & ({ type: "ENTREPRISE"; entreprise: IEntreprise } | { type: "CFA"; cfa: ICFA })
type JobResource = { job: IJob; recruiterResource: RecruiterResource }
type ApplicationResource = { application: IApplication; jobResource?: JobResource; applicantId?: string; user?: IUserWithAccount | null }
type EntrepriseResource = { entreprise: IEntreprise }
type JobPartnerResource = { job: IJobsPartnersOfferPrivate }
type UserResource = {
  user: IUserWithAccount
  entreprises: IEntreprise[] | null
}

type Resources = {
  users: Array<UserResource>
  recruiters: Array<RecruiterResource>
  jobs: Array<JobResource>
  applications: Array<ApplicationResource>
  entreprises: Array<EntrepriseResource>
  jobPartners: Array<JobPartnerResource>
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
    const cfa = await getDbCollection("cfas").findOne({ siret: cfa_delegated_siret })
    if (!cfa) {
      throw internal(`could not find cfa for recruiter with id=${recruiter._id}`)
    }
    return { recruiter, type: CFA, cfa }
  } else {
    const entreprise = await getDbCollection("entreprises").findOne({ siret: establishment_siret })
    if (!entreprise) {
      throw internal(`could not find entreprise for recruiter with id=${recruiter._id}`)
    }
    return { recruiter, type: ENTREPRISE, entreprise }
  }
}

const jobToJobResource = async (job: IJob, recruiter: IRecruiter): Promise<JobResource> => {
  const recruiterResource = await recruiterToRecruiterResource(recruiter)
  return { job, recruiterResource }
}

const getEntreprisesManagedByUser = async (user: IUserWithAccount) => {
  const entreprises = await getDbCollection("rolemanagements")
    .aggregate([
      {
        $match: { user_id: user._id, authorized_type: ENTREPRISE },
      },
      {
        // conversion de authorized_id en ObjectId
        $addFields: {
          authorizedId: { $toObjectId: "$authorized_id" },
        },
      },
      {
        // récupération des entreprises correspondantes à rolemanagements.authorized_id
        $lookup: {
          from: "entreprises",
          localField: "authorizedId",
          foreignField: "_id",
          as: "entreprises",
        },
      },
      {
        $unwind: "$entreprises",
      },
      {
        // on garde les entreprises
        $project: {
          _id: 0,
          entreprises: 1,
        },
      },
    ])
    .toArray()

  return entreprises?.length ? entreprises.map((entreprise) => entreprise.entreprises) : null
}

async function getRecruitersResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["recruiters"]> {
  if (!schema.securityScheme.resources.recruiter) {
    return []
  }

  const recruiters: IRecruiter[] = (
    await Promise.all(
      schema.securityScheme.resources.recruiter.map(async (recruiterDef): Promise<IRecruiter[]> => {
        if ("_id" in recruiterDef) {
          const recruiterOpt = await getDbCollection("recruiters").findOne({ _id: new ObjectId(getAccessResourcePathValue(recruiterDef._id, req)) })
          return recruiterOpt ? [recruiterOpt] : []
        }
        if ("establishment_id" in recruiterDef) {
          return getDbCollection("recruiters")
            .find({
              establishment_id: getAccessResourcePathValue(recruiterDef.establishment_id, req),
            })
            .toArray()
        }
        if ("email" in recruiterDef && "establishment_siret" in recruiterDef) {
          return getDbCollection("recruiters")
            .find({
              email: getAccessResourcePathValue(recruiterDef.email, req),
              establishment_siret: getAccessResourcePathValue(recruiterDef.establishment_siret, req),
            })
            .toArray()
        }
        if ("opco" in recruiterDef) {
          return getDbCollection("recruiters")
            .find({ opco: getAccessResourcePathValue(recruiterDef.opco, req) })
            .toArray()
        }
        if ("cfa_delegated_siret" in recruiterDef) {
          return getDbCollection("recruiters")
            .find({ cfa_delegated_siret: getAccessResourcePathValue(recruiterDef.cfa_delegated_siret, req) })
            .toArray()
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
          const id = new ObjectId(getAccessResourcePathValue(jobDef._id, req))
          const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": id })

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
          const userId = new ObjectId(getAccessResourcePathValue(userDef._id, req))
          const userOpt = await getDbCollection("userswithaccounts").findOne({ _id: userId })

          if (userOpt) {
            return {
              user: userOpt,
              entreprises: await getEntreprisesManagedByUser(userOpt),
            }
          }
          return null
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
        const id = new ObjectId(getAccessResourcePathValue(applicationDef._id, req))
        const application = await getDbCollection("applications").findOne({ _id: id })

        if (!application) return null
        const { job_id } = application
        if (!job_id) {
          return { application }
        }
        const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": new ObjectId(job_id) })
        if (!recruiter) {
          return { application }
        }
        const job = recruiter.jobs.find((job) => job._id.toString() === job_id)
        if (!job) {
          return { application }
        }
        const jobResource = await jobToJobResource(job, recruiter)
        const user = await getUserWithAccountByEmail(application.applicant_email)
        return { application, jobResource, user }
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
        const entreprise = await getDbCollection("entreprises").findOne({ siret })
        return entreprise ? { entreprise } : null
      } else if ("_id" in entrepriseDef) {
        const id = getAccessResourcePathValue(entrepriseDef._id, req)
        try {
          new ObjectId(id)
        } catch (e) {
          return null
        }
        const entreprise = await getDbCollection("entreprises").findOne({ _id: new ObjectId(id.toString()) })
        return entreprise ? { entreprise } : null
      }

      assertUnreachable(entrepriseDef)
    })
  )
  return results.flatMap((_) => (_ ? [_] : []))
}

async function getJobsPartnerResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["jobPartners"]> {
  if (!schema.securityScheme.resources.jobPartner) {
    return []
  }

  const results: (JobPartnerResource | null)[] = await Promise.all(
    schema.securityScheme.resources.jobPartner.map(async (jobPartnerDef): Promise<JobPartnerResource | null> => {
      if ("_id" in jobPartnerDef) {
        const _id = getAccessResourcePathValue(jobPartnerDef._id, req)
        const job = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(_id) })
        return job ? { job } : null
      }
      assertUnreachable(jobPartnerDef)
    })
  )
  return results.flatMap((_) => (_ ? [_] : []))
}

async function getResources<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources> {
  const [recruiters, jobs, users, applications, entreprises, jobPartners] = await Promise.all([
    getRecruitersResource(schema, req),
    getJobsResource(schema, req),
    getUserResource(schema, req),
    getApplicationResource(schema, req),
    getEntrepriseResource(schema, req),
    getJobsPartnerResource(schema, req),
  ])

  return {
    recruiters,
    jobs,
    users,
    applications,
    entreprises,
    jobPartners,
  }
}

function canAccessRecruiter(userAccess: ComputedUserAccess, resource: RecruiterResource): boolean {
  const recruiterOpco = parseEnum(OPCOS_LABEL, resource.recruiter.opco ?? null)
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
  if (userAccess.users.includes(resource.user._id.toString())) {
    return true
  }
  return userAccess.opcos.some((opco) => resource.entreprises && resource.entreprises.some((entreprise) => entreprise.opco === opco))
}

function canAccessApplication(userAccess: ComputedUserAccess, resource: ApplicationResource): boolean {
  const { jobResource, user } = resource
  // TODO ajout de granularité pour les accès candidat et recruteur
  return (jobResource && canAccessJob(userAccess, jobResource)) || (user ? canAccessUser(userAccess, { user, entreprises: [] }) : false)
}

function canAccessEntreprise(userAccess: ComputedUserAccess, resource: EntrepriseResource): boolean {
  const { entreprise } = resource
  const entrepriseOpco = parseEnum(OPCOS_LABEL, entreprise.opco)
  return userAccess.entreprises.includes(entreprise._id.toString()) || Boolean(entrepriseOpco && userAccess.opcos.includes(entrepriseOpco))
}

function canAccessJobPartner(userAccess: ComputedUserAccess, resource: JobPartnerResource): boolean {
  const { job } = resource
  return userAccess.partner_label.includes(job.partner_label)
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
    resources.entreprises.every((entreprise) => canAccessEntreprise(userAccess, entreprise)) &&
    resources.jobPartners.every((job) => canAccessJobPartner(userAccess, job))
  )
}

export async function authorizationMiddleware<S extends Pick<IRouteSchema, "method" | "path"> & WithSecurityScheme>(schema: S, req: IRequest) {
  if (!schema.securityScheme) {
    throw internal(`authorizationMiddleware: route doesn't have security scheme`, { method: schema.method, path: schema.path })
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
      throw forbidden("l'email doit être validé")
    }
    if (isUserDisabled(user)) {
      throw forbidden("user désactivé")
    }
    const { _id } = user
    grantedRoles = await getGrantedRoles(_id.toString())
    const isAdmin = grantedRoles.some((role) => role.authorized_type === AccessEntityType.ADMIN)
    if (isAdmin) {
      return
    }
    if (!grantedRoles.length) {
      throw forbidden("aucun role")
    }
  }

  if (requestedAccess === "admin") {
    throw forbidden("admin required")
  }

  const resources = await getResources(schema, req)

  if (userType === "ICredential") {
    const { organisation } = userWithType.value
    if (organisation.toLowerCase() === ADMIN.toLowerCase()) {
      return
    }
    const opco = parseEnum(OPCOS_LABEL, organisation)
    const userAccess: ComputedUserAccess = {
      admin: false,
      users: [],
      cfas: [],
      entreprises: [],
      opcos: opco ? [opco] : [],
      partner_label: [],
    }
    if (!isAuthorized(requestedAccess, userAccess, resources)) {
      throw forbidden("non autorisé")
    }
  } else if (userType === "IUser2") {
    const { _id } = userWithType.value
    const userAccess: ComputedUserAccess = getComputedUserAccess(_id.toString(), grantedRoles)
    if (!isAuthorized(requestedAccess, userAccess, resources)) {
      throw forbidden("non autorisé")
    }
  } else if (userType === "IApiApprentissage") {
    const { organisation, habilitations } = userWithType.value
    /**
     * KBA : temporaire, à modifier lorsque l'ensemble des habilitations seront définit
     */
    if (schema.securityScheme.access !== "job:manage" || !habilitations["jobs:write"] || !organisation) {
      throw forbidden("Unauthorized")
    }
    const userAccess: ComputedUserAccess = {
      admin: false,
      users: [],
      cfas: [],
      entreprises: [],
      opcos: [],
      partner_label: [organisation],
    }
    if (!isAuthorized(requestedAccess, userAccess, resources)) {
      throw forbidden("Unauthorized")
    }
  } else {
    assertUnreachable(userType)
  }
}

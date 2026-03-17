import { forbidden, internal } from "@hapi/boom"
import type { IApiAlternanceTokenData } from "api-alternance-sdk"
import type { FastifyRequest } from "fastify"
import { ObjectId } from "mongodb"
import { ADMIN, ENTREPRISE, OPCOS_LABEL } from "shared/constants/recruteur"
import type { ICFA } from "shared/models/cfa.model"
import type { IEntreprise } from "shared/models/entreprise.model"
import type { ComputedUserAccess, IApplication, IUserWithAccount } from "shared/models/index"
import type { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import type { IRoleManagement } from "shared/models/roleManagement.model"
import { AccessEntityType } from "shared/models/roleManagement.model"
import type { IRouteSchema, WithSecurityScheme } from "shared/routes/common.routes"
import type { AccessPermission, AccessResourcePath } from "shared/security/permissions"
import { assertUnreachable, parseEnum } from "shared/utils/index"
import type { Primitive } from "type-fest"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { getApplicantFromDB } from "@/services/applicant.service"
import { establishmentIdToUserIdAndSiret } from "@/services/etablissement.service"
import { getComputedUserAccess, getGrantedRoles } from "@/services/roleManagement.service"
import { getUserWithAccountByEmail, isUserDisabled, isUserEmailChecked } from "@/services/userWithAccount.service"
import { getUserFromRequest } from "./authenticationService"

type JobResource = { job: IJobsPartnersOfferPrivate; entreprise?: IEntreprise; cfa?: ICFA }
type ApplicationResource = { application: IApplication; jobResource?: JobResource; applicantId?: string; user?: IUserWithAccount | null }
type EntrepriseResource = { entreprise: IEntreprise }
type UserResource = {
  user: IUserWithAccount
  entreprises: IEntreprise[]
}

type Resources = {
  users: Array<UserResource>
  jobs: Array<JobResource>
  applications: Array<ApplicationResource>
  entreprises: Array<EntrepriseResource>
}
export type ResourceIds = {
  jobs?: Array<{ job: string } | null>
  users?: Array<string>
  applications?: Array<{ application: string; job: string } | null>
}

// Specify what we need to simplify mocking in tests
type IRequest = Pick<FastifyRequest, "user" | "params" | "query" | "authorizationContext" | "userAccess">

// TODO: Unit test access control
// TODO: job.delegations
// TODO: Unit schema access path properly defined (exists in Zod schema)

function getAccessResourcePathValue(path: AccessResourcePath, req: IRequest): any {
  const obj = req[path.type] as Record<string, Primitive>
  return obj[path.key]
}

const jobToJobResource = async (job: IJobsPartnersOfferPrivate): Promise<JobResource | null> => {
  const entreprise = await getDbCollection("entreprises").findOne({ siret: job.workplace_siret ?? "" })
  if (!entreprise) {
    return { job }
  }
  let cfa: ICFA | null = null
  if (job.cfa_siret) {
    cfa = await getDbCollection("cfas").findOne({ siret: job.cfa_siret })
    if (!cfa) {
      return { job, entreprise }
    }
  }
  return { job, entreprise, cfa: cfa ?? undefined }
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

  return entreprises?.length ? entreprises.map((entreprise) => entreprise.entreprises) : []
}

async function getJobsResource<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources["jobs"]> {
  if (!schema.securityScheme.resources.job) {
    return []
  }
  return (
    await Promise.all(
      schema.securityScheme.resources.job.map(async (jobDef): Promise<JobResource[] | null> => {
        if ("_id" in jobDef) {
          const { _id } = jobDef
          const id = new ObjectId(getAccessResourcePathValue(_id, req))
          const jobPartner = await getDbCollection("jobs_partners").findOne({ _id: id })
          if (!jobPartner) {
            return null
          }
          const result = await jobToJobResource(jobPartner)
          return result ? [result] : null
        } else if ("establishment_id" in jobDef) {
          const establishmentIdValue = getAccessResourcePathValue(jobDef.establishment_id, req)
          const { userId, siret } = await establishmentIdToUserIdAndSiret(establishmentIdValue)
          const jobPartners = await getDbCollection("jobs_partners")
            .find({
              partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
              workplace_siret: siret,
              managed_by: userId,
            })
            .toArray()
          return (await Promise.all(jobPartners.map(jobToJobResource))).flatMap((x) => (x ? [x] : []))
        } else if ("opco" in jobDef) {
          const { opco } = jobDef
          const opcoValue = getAccessResourcePathValue(opco, req)
          const jobPartners = await getDbCollection("jobs_partners")
            .find({
              partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
              workplace_opco: opcoValue,
            })
            .toArray()
          return (await Promise.all(jobPartners.map(jobToJobResource))).flatMap((x) => (x ? [x] : []))
        } else if ("cfa_delegated_siret" in jobDef) {
          const cfaSiretValue = getAccessResourcePathValue(jobDef.cfa_delegated_siret, req)
          const jobPartners = await getDbCollection("jobs_partners")
            .find({
              partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
              cfa_siret: cfaSiretValue,
            })
            .toArray()
          return (await Promise.all(jobPartners.map(jobToJobResource))).flatMap((x) => (x ? [x] : []))
        } else if ("email" in jobDef && "establishment_siret" in jobDef) {
          const emailValue = getAccessResourcePathValue(jobDef.email, req)
          const siretValue = getAccessResourcePathValue(jobDef.establishment_siret, req)
          const user = await getUserWithAccountByEmail(emailValue)
          if (!user) {
            return null
          }
          const jobPartners = await getDbCollection("jobs_partners")
            .find({
              partner_label: JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA,
              workplace_siret: siretValue,
              managed_by: user._id,
            })
            .toArray()
          return (await Promise.all(jobPartners.map(jobToJobResource))).flatMap((x) => (x ? [x] : []))
        }

        assertUnreachable(jobDef)
      })
    )
  ).flatMap((_) => (_ ? _ : []))
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
        const job = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(job_id) })
        if (!job) {
          return { application }
        }
        const jobResource = await jobToJobResource(job)
        if (!jobResource) {
          return { application }
        }
        const applicantOpt = await getApplicantFromDB({ _id: application.applicant_id })
        if (applicantOpt) {
          const user = await getUserWithAccountByEmail(applicantOpt.email)
          return { application, jobResource, user }
        } else {
          return { application, jobResource }
        }
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
        } catch (_) {
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

async function getResources<S extends WithSecurityScheme>(schema: S, req: IRequest): Promise<Resources> {
  const [jobs, users, applications, entreprises] = await Promise.all([
    getJobsResource(schema, req),
    getUserResource(schema, req),
    getApplicationResource(schema, req),
    getEntrepriseResource(schema, req),
  ])

  return {
    jobs,
    users,
    applications,
    entreprises,
  }
}

function canAccessJob(userAccess: ComputedUserAccess, resource: JobResource): boolean {
  const { job, cfa, entreprise } = resource
  if (job.partner_label === JOBPARTNERS_LABEL.OFFRES_EMPLOI_LBA) {
    const { managed_by, workplace_opco } = job
    const firstTest = (managed_by && userAccess.users.includes(managed_by.toString())) || (workplace_opco && userAccess.opcos.includes(workplace_opco))
    if (firstTest) {
      return true
    }
    if (cfa) {
      return userAccess.cfas.includes(cfa._id.toString())
    } else {
      const entrepriseId = entreprise?._id.toString()
      return Boolean(entrepriseId && userAccess.entreprises.includes(entrepriseId))
    }
  } else {
    return userAccess.partner_label.includes(job.partner_label)
  }
}

function canAccessUser(userAccess: ComputedUserAccess, resource: Resources["users"][number]): boolean {
  if (userAccess.users.includes(resource.user._id.toString())) {
    return true
  }
  return userAccess.opcos.some((opco) => resource.entreprises.some((entreprise) => entreprise.opco === opco))
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

function isApiApprentissageAuthorized(requestedAccess: AccessPermission, habilitations: IApiAlternanceTokenData["habilitations"]): boolean {
  switch (requestedAccess) {
    case "api-apprentissage:applications":
      return habilitations["applications:write"]
    case "api-apprentissage:jobs":
      return habilitations["jobs:write"]
    case "api-apprentissage:appointment":
      return habilitations["appointments:write"]

    default:
      return false
  }
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
    resources.jobs.every((job) => canAccessJob(userAccess, job)) &&
    resources.applications.every((application) => canAccessApplication(userAccess, application)) &&
    resources.users.every((user) => canAccessUser(userAccess, user)) &&
    resources.entreprises.every((entreprise) => canAccessEntreprise(userAccess, entreprise))
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
    // authorization check done in authentication
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
      req.userAccess = {
        admin: true,
        users: [],
        cfas: [],
        entreprises: [],
        opcos: [],
        partner_label: [],
      }
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
    req.userAccess = userAccess
  } else if (userType === "IUser2") {
    const { _id } = userWithType.value
    const userAccess: ComputedUserAccess = getComputedUserAccess(_id.toString(), grantedRoles)
    if (!isAuthorized(requestedAccess, userAccess, resources)) {
      throw forbidden("non autorisé")
    }
    req.userAccess = userAccess
  } else if (userType === "IApiApprentissage") {
    const { organisation, habilitations } = userWithType.value
    if (!organisation) {
      throw forbidden("Unauthorized: user organisation not defined")
    }
    if (!isApiApprentissageAuthorized(requestedAccess, habilitations)) {
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
    req.userAccess = userAccess
  } else {
    assertUnreachable(userType)
  }
}

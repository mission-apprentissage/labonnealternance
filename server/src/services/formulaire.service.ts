import { randomUUID } from "node:crypto"

import { badRequest, internal, notFound } from "@hapi/boom"
import equal from "fast-deep-equal"
import { ChangeStreamInsertDocument, ChangeStreamUpdateDocument, Filter, ObjectId, UpdateFilter } from "mongodb"
import {
  assertUnreachable,
  IDelegation,
  IJob,
  IJobCreate,
  IJobWithRomeDetail,
  IRecruiter,
  IRecruiterWithApplicationCount,
  ITrackingCookies,
  IUserRecruteur,
  JOB_STATUS,
  JOB_STATUS_ENGLISH,
  removeAccents,
} from "shared"
import { LBA_ITEM_TYPE, UNKNOWN_COMPANY } from "shared/constants/lbaitem"
import { NIVEAUX_POUR_LBA, OPCOS_LABEL, RECRUITER_STATUS, RECRUITER_USER_ORIGIN, TRAINING_CONTRACT_TYPE } from "shared/constants/recruteur"
import { getDirectJobPath } from "shared/metier/lbaitemutils"
import { EntrepriseStatus, IEntreprise } from "shared/models/entreprise.model"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { IComputedJobsPartners } from "shared/models/jobsPartnersComputed.model"
import { AccessEntityType, AccessStatus } from "shared/models/roleManagement.model"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { getLastStatusEvent } from "shared/utils/getLastStatusEvent"

import { logger } from "@/common/logger"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { anonymizeLbaJobsPartners } from "@/services/partnerJob.service"

import { asyncForEach } from "../common/utils/asyncUtils"
import { getDbCollection } from "../common/utils/mongodbUtils"
import { removeHtmlTagsFromString } from "../common/utils/stringUtils"
import config from "../config"

import { getUser2ManagingOffer } from "./application.service"
import { createViewDelegationLink } from "./appLinks.service"
import { getCatalogueFormations } from "./catalogue.service"
import dayjs from "./dayjs.service"
import { sendEmailConfirmationEntreprise } from "./etablissement.service"
import { getCity, getLbaJobContactInfo, replaceRecruiterFieldsWithCfaFields } from "./lbajob.service"
import mailer from "./mailer.service"
import { getComputedUserAccess, getGrantedRoles } from "./roleManagement.service"
import { getRomeDetailsFromDB } from "./rome.service"
import { saveJobTrafficSourceIfAny } from "./trafficSource.service"
import { isUserEmailChecked, validateUserWithAccountEmail } from "./userWithAccount.service"

type ISentDelegation = {
  raison_sociale: string
  siret_code: string
  adresse_etablissement: string
}

export interface IOffreExtended extends IJob {
  candidatures: number
  pourvue: string
  supprimer: string
}
const romeDetailAndCandidatureCountAggregateStage = [
  { $addFields: { jobs: { $cond: { if: { $isArray: "$jobs" }, then: "$jobs", else: [] } } } },
  {
    $facet: {
      emptyJobs: [{ $match: { jobs: { $eq: [] } } }],
      nonEmptyJobs: [
        { $match: { jobs: { $ne: [] } } },
        { $unwind: { path: "$jobs" } },
        {
          $lookup: {
            from: "referentielromes",
            let: { rome_code: { $arrayElemAt: ["$jobs.rome_code", 0] } },
            pipeline: [{ $match: { $expr: { $eq: ["$rome.code_rome", "$$rome_code"] } } }],
            as: "referentielrome",
          },
        },
        { $unwind: { path: "$referentielrome", preserveNullAndEmptyArrays: true } },
        { $set: { "jobs.rome_detail": "$referentielrome" } },
        { $addFields: { "jobs.jobIdStr": { $toString: "$jobs._id" } } },
        {
          $lookup: {
            from: "applications",
            let: { jobIdStr: "$jobs.jobIdStr" },
            pipeline: [{ $match: { $expr: { $eq: ["$job_id", "$$jobIdStr"] } } }, { $project: { _id: 1 } }],
            as: "applications",
          },
        },
        { $set: { "jobs.candidatures": { $size: "$applications" } } },
        { $group: { _id: "$_id", recruiters: { $first: "$$ROOT" }, jobs: { $push: { $mergeObjects: ["$jobs"] } } } },
        { $replaceRoot: { newRoot: { $mergeObjects: ["$recruiters", { jobs: "$jobs" }] } } },
        { $project: { referentielrome: 0, "jobs.rome_detail._id": 0, "jobs.rome_detail.couple_appellation_rome": 0, "jobs.jobIdStr": 0, applications: 0 } },
      ],
    },
  },
  { $project: { result: { $cond: { if: { $gt: [{ $size: "$emptyJobs" }, 0] }, then: { $arrayElemAt: ["$emptyJobs", 0] }, else: { $arrayElemAt: ["$nonEmptyJobs", 0] } } } } },
  { $replaceRoot: { newRoot: "$result" } },
]

// étape d'aggragation mongo permettant de récupérer le rome_detail correspondant dans chaque job d'un recruiter
export const romeDetailAggregateStages = [
  { $unwind: { path: "$jobs" } },
  { $lookup: { from: "referentielromes", localField: "jobs.rome_code.0", foreignField: "rome.code_rome", as: "referentielrome" } },
  { $unwind: { path: "$referentielrome" } },
  { $set: { "jobs.rome_detail": "$referentielrome" } },
  { $group: { _id: "$_id", recruiters: { $first: "$$ROOT" }, jobs: { $push: "$jobs" } } },
  { $replaceRoot: { newRoot: { $mergeObjects: ["$recruiters", { jobs: "$jobs" }] } } },
  { $project: { referentielrome: 0, "jobs.rome_detail._id": 0, "jobs.rome_detail.couple_appellation_rome": 0 } },
]

/**
 * @description get formulaire by offer id
 */
export const getOffreAvecInfoMandataire = async (id: string | ObjectId): Promise<{ recruiter: IRecruiter; job: IJob } | null> => {
  const recruiterOpt = await getOffreWithRomeDetail(id)

  if (!recruiterOpt) {
    return null
  }
  const job = recruiterOpt.jobs.find((x) => x._id.toString() === id.toString())
  if (!job) {
    return null
  }
  recruiterOpt.jobs = [job]
  await replaceRecruiterFieldsWithCfaFields(recruiterOpt)
  return { recruiter: recruiterOpt, job }
}

/**
 * @description Get formulaire list with mondodb paginate query
 * @param {Object} payload
 * @param {Filter<IRecruiter>} payload.query
 * @param {object} payload.options
 * @param {number} payload.page
 * @param {number} payload.limit
 */
export const getFormulaires = async (query: Filter<IRecruiter>, select: object, { page = 1, limit = 10 }: { page?: number; limit?: number }) => {
  const response = await getDbCollection("recruiters").find(query, { projection: select })
  const data =
    page && limit
      ? await response
          .skip(page > 0 ? (page - 1) * limit : 0)
          .limit(limit)
          .toArray()
      : await response.toArray()
  const total = await getDbCollection("recruiters").countDocuments(query)
  const number_of_page = limit ? Math.ceil(total / limit) : undefined
  return { pagination: { page, result_per_page: limit, number_of_page, total }, data }
}

const isAuthorizedToPublishJob = async ({ userId, entrepriseId }: { userId: ObjectId; entrepriseId: ObjectId }) => {
  const access = getComputedUserAccess(userId.toString(), await getGrantedRoles(userId.toString()))
  return access.admin || access.entreprises.includes(entrepriseId.toString())
}

/**
 * @description Create job offer for formulaire
 */
export const createJob = async ({
  job,
  establishment_id,
  user,
  source,
}: {
  job: IJobCreate
  establishment_id: string
  user: IUserWithAccount
  source?: ITrackingCookies
}): Promise<IRecruiter> => {
  await validateFieldsFromReferentielRome(job)

  const userId = user._id
  const recruiter = await getDbCollection("recruiters").findOne({ establishment_id: establishment_id })
  if (!recruiter) {
    throw internal(`recruiter with establishment_id=${establishment_id} not found`)
  }
  const { is_delegated, cfa_delegated_siret } = recruiter
  const organization = await (cfa_delegated_siret
    ? getDbCollection("cfas").findOne({ siret: cfa_delegated_siret })
    : getDbCollection("entreprises").findOne({ siret: recruiter.establishment_siret }))
  if (!organization) {
    throw internal(`inattendu : impossible retrouver l'organisation pour establishment_id=${establishment_id}`)
  }
  let isOrganizationValid = false
  let entrepriseStatus: EntrepriseStatus | null = null
  if (cfa_delegated_siret) {
    isOrganizationValid = true
  } else if ("status" in organization) {
    entrepriseStatus = getLastStatusEvent((organization as IEntreprise).status)?.status ?? null
    isOrganizationValid = entrepriseStatus === EntrepriseStatus.VALIDE && (await isAuthorizedToPublishJob({ userId, entrepriseId: organization._id }))
  }
  const isUserEmailConfirmed = isUserEmailChecked(user)
  const isJobActive = isOrganizationValid && isUserEmailConfirmed

  const newJobStatus = isJobActive ? JOB_STATUS.ACTIVE : JOB_STATUS.EN_ATTENTE
  // get user activation state if not managed by a CFA
  const codeRome = job.rome_code.at(0)
  if (!codeRome) {
    throw internal(`inattendu : pas de code rome pour une création d'offre pour le recruiter id=${establishment_id}`)
  }
  const creationDate = new Date()
  const { job_start_date } = job
  const updatedJob: Partial<IJob> = Object.assign(job, {
    job_status: newJobStatus,
    job_start_date,
    job_creation_date: creationDate,
    job_expiration_date: addExpirationPeriod(creationDate).toDate(),
    job_update_date: creationDate,
    managed_by: userId.toString(),
  })
  // insert job
  const updatedFormulaire = await createOffre(establishment_id, updatedJob)
  const { jobs } = updatedFormulaire
  const createdJob = jobs.at(jobs.length - 1)
  if (!createdJob) {
    throw internal("unexpected: no job found after job creation")
  }
  // if first offer creation for an Entreprise, send specific mail
  if (jobs.length === 1 && is_delegated === false) {
    if (!entrepriseStatus) {
      throw internal(`inattendu : pas de status pour l'entreprise pour establishment_id=${establishment_id}`)
    }
    const role = await getDbCollection("rolemanagements").findOne({ user_id: userId, authorized_type: AccessEntityType.ENTREPRISE, authorized_id: organization._id.toString() })
    const roleStatus = getLastStatusEvent(role?.status)?.status ?? null
    await sendEmailConfirmationEntreprise(user, updatedFormulaire, roleStatus, entrepriseStatus)

    if (source) {
      await saveJobTrafficSourceIfAny({ job_id: createdJob._id, source })
    }

    return updatedFormulaire
  }

  let contactCFA: IUserWithAccount | null = null
  if (is_delegated) {
    if (!cfa_delegated_siret) {
      throw internal(`unexpected: could not find user recruteur CFA that created the job`)
    }
    // get CFA informations if formulaire is handled by a CFA
    contactCFA = await getUser2ManagingOffer(createdJob)
    if (!contactCFA) {
      throw internal(`unexpected: could not find user recruteur CFA that created the job`)
    }
  }
  await sendMailNouvelleOffre(updatedFormulaire, createdJob, contactCFA ?? undefined)

  // register tracking req.cookies
  if (source) {
    await saveJobTrafficSourceIfAny({ job_id: createdJob._id, source })
  }

  return updatedFormulaire
}

/**
 * Create job delegations
 */
export const createJobDelegations = async ({ jobId, etablissementCatalogueIds }: { jobId: IJob["_id"] | string; etablissementCatalogueIds: string[] }): Promise<IRecruiter> => {
  const recruiter = await getOffre(jobId)
  if (!recruiter) {
    throw internal("Offre not found", { jobId, etablissementCatalogueIds })
  }
  const offre = getJobFromRecruiter(recruiter, jobId.toString())
  const managingUser = await getUser2ManagingOffer(offre)
  const entreprise = await getDbCollection("entreprises").findOne({ siret: recruiter.establishment_siret })
  let shouldSentMailToCfa = false
  if (entreprise) {
    const role = await getDbCollection("rolemanagements").findOne({
      user_id: managingUser._id,
      authorized_id: entreprise._id.toString(),
      authorized_type: AccessEntityType.ENTREPRISE,
    })
    if (role && getLastStatusEvent(role.status)?.status === AccessStatus.GRANTED) {
      shouldSentMailToCfa = true
    }
  }
  const delegations: IDelegation[] = []
  const sentDelegations: ISentDelegation[] = []

  const formations = await getCatalogueFormations(
    {
      $or: [{ etablissement_gestionnaire_id: { $in: etablissementCatalogueIds } }, { etablissement_formateur_id: { $in: etablissementCatalogueIds } }],
      etablissement_gestionnaire_courriel: { $nin: [null, ""] },
      catalogue_published: true,
    },
    { etablissement_gestionnaire_courriel: 1, etablissement_formateur_siret: 1, etablissement_gestionnaire_id: 1, etablissement_formateur_id: 1 }
  )

  await Promise.all(
    etablissementCatalogueIds.map(async (etablissementId) => {
      //TODO: il y a des cas particuliers où des formations ont un siret différent tout en ayant le même etablissement_id
      // les délégations sont enregistrées sur le siret de la première formation trouvée
      // le problème est visible lorsque deux formations avec des sirets différents sont proposées sur la ui. Seule une d'entre elle sera
      // affichées comme délégation envoyée ce qui peut perturber l'utilisateur et le faire tenter de renvoyer la délégation
      const formation = formations.find((formation) => formation.etablissement_gestionnaire_id === etablissementId || formation.etablissement_formateur_id === etablissementId)
      const {
        etablissement_formateur_siret: siret_code,
        etablissement_gestionnaire_courriel: email,
        etablissement_formateur_entreprise_raison_sociale,
        etablissement_formateur_code_postal,
        etablissement_formateur_adresse,
        etablissement_formateur_localite,
      } = formation ?? {}
      if (!email || !siret_code) {
        // This shouldn't happen considering the query filter
        throw internal("Unexpected etablissement_gestionnaire_courriel", { jobId, etablissementCatalogueIds })
      }

      delegations.push({ siret_code, email })

      if (shouldSentMailToCfa) {
        await sendDelegationMailToCFA(email, offre, recruiter, siret_code)
        sentDelegations.push({
          raison_sociale: etablissement_formateur_entreprise_raison_sociale || "",
          siret_code,
          adresse_etablissement: `${etablissement_formateur_adresse}, ${etablissement_formateur_code_postal} ${etablissement_formateur_localite}`,
        })
      }
    })
  )
  const jobTitle = offre.offer_title_custom || offre.rome_appellation_label || offre.rome_label
  const jobUrl = new URL(`${config.publicUrl}/emploi/${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}/${offre._id}/${encodeURIComponent(jobTitle!)}`)
  if (sentDelegations.length) {
    await mailer.sendEmail({
      to: recruiter.email,
      subject: `Votre offre a été partagée à ${sentDelegations.length} école(s)`,
      template: getStaticFilePath("./templates/mail-mer-confirmation.mjml.ejs"),
      data: {
        first_name: recruiter.first_name,
        last_name: recruiter.last_name,
        email: recruiter.email,
        phone: recruiter.phone,
        job_title: jobTitle,
        job_url: jobUrl,
        delegations: sentDelegations,
        images: {
          logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`,
          logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true`,
        },
      },
    })
  }

  offre.delegations = offre.delegations?.concat(delegations) ?? delegations
  offre.job_delegation_count = offre.delegations.length

  return updateOffre(jobId, offre)
}

/**
 * @description Check if job offer exists
 * @param {IJob['_id']} id
 * @returns {Promise<IRecruiter>}
 */
export const checkOffreExists = async (id: IJob["_id"]): Promise<boolean> => {
  const offre = await getOffre(id)
  return offre ? true : false
}

/**
 * @description Find formulaire by query
 * @param {Filter<IRecruiter>} query
 * @returns {Promise<IRecruiter>}
 */
export const getFormulaire = async (query: Filter<IRecruiter>): Promise<IRecruiter | null> => getDbCollection("recruiters").findOne(query)

export const getFormulaireWithRomeDetail = async (query: Filter<IRecruiter>): Promise<IRecruiter | null> => {
  const recruiterWithRomeDetail = (await getDbCollection("recruiters")
    .aggregate([{ $match: query }, ...romeDetailAggregateStages])
    .toArray()) as IRecruiter[]

  return recruiterWithRomeDetail.length ? recruiterWithRomeDetail[0] : await getFormulaire(query)
}
export const getFormulaireWithRomeDetailAndApplicationCount = async (query: Filter<IRecruiter>): Promise<IRecruiterWithApplicationCount | null> => {
  const recruiterWithRomeDetailAndApplicationCount = (await getDbCollection("recruiters")
    .aggregate([{ $match: query }, ...romeDetailAndCandidatureCountAggregateStage])
    .toArray()) as IRecruiterWithApplicationCount[]

  return recruiterWithRomeDetailAndApplicationCount.length ? recruiterWithRomeDetailAndApplicationCount[0] : null
}

/**
 * @description Create new formulaire
 * @param {IRecruiter} payload
 * @returns {Promise<IRecruiter>}
 */
export const createFormulaire = async (payload: Partial<Omit<IRecruiter, "_id" | "establishment_id" | "createdAt" | "updatedAt">>, managedBy: string): Promise<IRecruiter> => {
  const recruiter: IRecruiter = {
    ...payload,
    managed_by: managedBy,
    _id: new ObjectId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    establishment_id: randomUUID(),
    status: RECRUITER_STATUS.ACTIF,
    email: payload.email as string,
    establishment_siret: payload.establishment_siret as string,
    is_delegated: payload.is_delegated ?? (false as boolean),
    opco: payload.opco ?? null,
    idcc: payload.idcc ?? null,
    jobs: [],
  }
  await getDbCollection("recruiters").insertOne(recruiter)
  return recruiter
}

/**
 * Remove formulaire by id
 */
export const deleteFormulaire = async (id: IRecruiter["_id"]): Promise<IRecruiter | null> => await getDbCollection("recruiters").findOneAndDelete({ _id: id })

/**
 * @description Update existing formulaire and return updated version
 */
export const updateFormulaire = async (establishment_id: IRecruiter["establishment_id"], payload: UpdateFilter<IRecruiter>): Promise<IRecruiter> => {
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate({ establishment_id }, { $set: { ...payload, updatedAt: new Date() } }, { returnDocument: "after" })
  if (!recruiter) {
    throw internal("Recruiter not found")
  }
  return recruiter
}

/**
 * @description Archive existing formulaire and cancel all its job offers
 * @param {IRecruiter["establishment_id"]} establishment_id
 * @returns {Promise<boolean>}
 */
export const archiveFormulaireByEstablishmentId = async (id: IRecruiter["establishment_id"]) => {
  const recruiter = await getDbCollection("recruiters").findOne({ establishment_id: id })
  if (!recruiter) {
    throw internal("Recruiter not found")
  }

  await archiveFormulaire(recruiter)
}

export const archiveFormulaire = async (recruiter: IRecruiter) => {
  recruiter.status = RECRUITER_STATUS.ARCHIVE
  recruiter.jobs.map((job) => {
    if (job.job_status !== JOB_STATUS.ANNULEE) {
      job.job_expiration_date = new Date()
    }
    job.job_status = JOB_STATUS.ANNULEE
  })
  await getDbCollection("recruiters").findOneAndUpdate({ _id: recruiter._id }, { $set: { ...recruiter, updatedAt: new Date() } })
}

/**
 * @description Unarchive existing formulaire
 * @param {IRecruiter["establishment_id"]} establishment_id
 * @returns {Promise<boolean>}
 */
export const activateRecruiter = async (id: IRecruiter["_id"]): Promise<boolean> => {
  const recruiter = await getDbCollection("recruiters").findOne({ _id: id })
  if (!recruiter) {
    throw internal("Recruiter not found")
  }
  await getDbCollection("recruiters").updateOne({ _id: id }, { $set: { status: RECRUITER_STATUS.ACTIF, updatedAt: new Date() } })
  return true
}

/**
 * @description Archive existing delegated formulaires and cancel all its job offers
 * @param {IUserRecruteur["establishment_siret"]} establishment_siret
 */
export const archiveDelegatedFormulaire = async (siret: IUserRecruteur["establishment_siret"]) => {
  const formulaires = await getDbCollection("recruiters").find({ cfa_delegated_siret: siret }).toArray()
  if (!formulaires.length) return false
  await asyncForEach(formulaires, archiveFormulaire)
}

/**
 * @description Get job offer by job id
 * @param {IJob["_id"]} id
 */
export async function getOffre(id: string | ObjectId) {
  return getDbCollection("recruiters").findOne({ "jobs._id": new ObjectId(id.toString()) })
}

export async function getOffreWithRomeDetail(id: string | ObjectId) {
  // return a Document type incompatible, to be checked
  const recruiter = (await getDbCollection("recruiters")
    .aggregate([{ $match: { "jobs._id": new ObjectId(id) } }, ...romeDetailAggregateStages])
    .toArray()) as IRecruiter[]

  return recruiter.length ? recruiter[0] : null
}

/**
 * Create job offer on existing formulaire
 */
export async function createOffre(establishment_id: IRecruiter["establishment_id"], payload: UpdateFilter<IJob>): Promise<IRecruiter> {
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate(
    { establishment_id },
    // @ts-ignore TODO: fix
    { $push: { jobs: { ...payload, _id: new ObjectId() } } }, // jobs timestamp are delivered in payload
    { returnDocument: "after" }
  )

  if (!recruiter) {
    throw internal("Recruiter not found")
  }

  return recruiter
}

/**
 * @description Update existing job offer
 * @param {IJob["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export async function updateOffre(id: string | ObjectId, payload: UpdateFilter<IJob>): Promise<IRecruiter> {
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate({ "jobs._id": id }, { $set: { "jobs.$": payload } }, { returnDocument: "after" })
  if (!recruiter) {
    throw internal("Recruiter not found")
  }
  return recruiter
}

/**
 * @description Update specific field(s) in an existing job offer
 * @param {IJob["_id"]} id
 * @param {object} payload
 * @returns {Promise<IRecruiter>}
 */
export const patchOffre = async (id: IJob["_id"], payload: Partial<IJob>): Promise<IRecruiter> => {
  await validateFieldsFromReferentielRome(payload)
  const fields = {}
  for (const key in payload) {
    fields[`jobs.$.${key}`] = payload[key]
  }

  const recruiter = await getDbCollection("recruiters").findOneAndUpdate(
    { "jobs._id": id },
    { $set: { ...fields, "jobs.$.job_update_date": new Date(), updatedAt: new Date() } },
    { returnDocument: "after" }
  )

  if (!recruiter) {
    throw internal("Recruiter not found")
  }

  return recruiter
}

export const updateJobDelegation = async (jobId: IJob["_id"], delegation: IDelegation) => {
  const now = new Date()
  await getDbCollection("recruiters").bulkWrite(
    [
      { updateOne: { filter: { "jobs._id": jobId }, update: { $set: { updatedAt: now, "jobs.$.job_update_date": now } } } },
      { updateOne: { filter: { "jobs._id": jobId }, update: { $pull: { "jobs.$.delegations": { siret_code: delegation.siret_code } } } } },
      { updateOne: { filter: { "jobs._id": jobId }, update: { $push: { "jobs.$.delegations": delegation } } } },
    ],
    { ordered: true }
  )
}

/**
 * @description Change job status to provided
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const provideOffre = async (id: IJob["_id"]): Promise<boolean> => {
  await getDbCollection("recruiters").findOneAndUpdate({ "jobs._id": id }, { $set: { "jobs.$.job_status": JOB_STATUS.POURVUE, "jobs.$.job_update_date": new Date() } })
  return true
}

/**
 * @description Cancel job from transaction email
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const cancelOffre = async (id: IJob["_id"]): Promise<boolean> => {
  const now = new Date()
  await getDbCollection("recruiters").findOneAndUpdate(
    { "jobs._id": id },
    { $set: { "jobs.$.job_status": JOB_STATUS.ANNULEE, "jobs.$.job_update_date": now, "jobs.$.job_expiration_date": now } }
  )
  return true
}

/**
 * @description Cancel job from admin interface
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const cancelOffreFromAdminInterface = async (id: IJob["_id"], { job_status, job_status_comment }): Promise<boolean> => {
  const now = new Date()
  await getDbCollection("recruiters").findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$[elem].job_status": job_status,
        "jobs.$[elem].job_status_comment": job_status_comment,
        "jobs.$[elem].job_update_date": now,
        "jobs.$[elem].job_expiration_date": now,
      },
    },
    { arrayFilters: [{ "elem._id": id }] }
  )
  return true
}

/**
 * @description Extends job duration by 1 month.
 * @param {IJob["_id"]} id
 * @returns {Promise<boolean>}
 */
export const extendOffre = async (id: IJob["_id"]): Promise<IJob> => {
  const now = new Date()
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate(
    { "jobs._id": id },
    {
      $set: {
        "jobs.$.job_expiration_date": addExpirationPeriod(dayjs()).toDate(),
        "jobs.$.job_last_prolongation_date": now,
        "jobs.$.job_update_date": now,
        "jobs.$.relance_mail_expiration_J7": null,
        "jobs.$.relance_mail_expiration_J1": null,
      },
      $inc: { "jobs.$.job_prolongation_count": 1 },
    },
    { returnDocument: "after" }
  )
  if (!recruiter) {
    throw notFound(`job with id=${id} not found`)
  }
  const job = recruiter.jobs.find((job) => job._id.toString() === id.toString())
  if (!job) {
    throw internal(`unexpected: job with id=${id} not found`)
  }
  return job
}

const activateAndExtendOffre = async (id: IJob["_id"]): Promise<IJob> => {
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate(
    { "jobs._id": id },
    { $set: { "jobs.$[x].job_expiration_date": addExpirationPeriod(dayjs()).toDate(), "jobs.$[x].job_status": JOB_STATUS.ACTIVE } },
    { arrayFilters: [{ "x._id": id }], returnDocument: "after" }
  )
  if (!recruiter) {
    throw notFound(`job with id=${id} not found`)
  }
  const job = recruiter.jobs.find((job) => job._id.toString() === id.toString())
  if (!job) {
    throw internal(`unexpected: job with id=${id} not found`)
  }
  return job
}

/**
 * activate offers if they are awaiting validation and the user is ready to publish its offers
 * @param recruiter entreprise
 */
export const checkForJobActivations = async (recruiter: IRecruiter) => {
  const awaitingJobs = recruiter.jobs.filter((job) => job.job_status === JOB_STATUS.EN_ATTENTE)
  if (!awaitingJobs.length) return
  const { managed_by } = recruiter
  if (!managed_by) return
  const managedByObjectId = new ObjectId(managed_by)
  const [userOpt, entreprise, roles] = await Promise.all([
    getDbCollection("userswithaccounts").findOne({ _id: managedByObjectId }),
    getDbCollection("entreprises").findOne({ siret: recruiter.establishment_siret }),
    getGrantedRoles(managed_by),
  ])
  if (!userOpt || !isUserEmailChecked(userOpt) || !entreprise) return
  const recruiterRole = roles.find((role) => role.authorized_id === entreprise._id.toString())
  if (!recruiterRole) return
  await asyncForEach(awaitingJobs, async (job) => {
    job = await activateAndExtendOffre(job._id)
    const delegations = job.delegations ?? []
    await Promise.all(delegations.map(async (delegation) => sendDelegationMailToCFA(delegation.email, job, recruiter, delegation.siret_code)))
  })
}

/**
 * @description Get job offer by its id.
 */
export const getJob = async (id: string | ObjectId): Promise<IJob | null> => {
  const offre = await getOffre(id)
  if (!offre) return null
  return offre.jobs.find((job) => job._id.toString() === id.toString()) ?? null
}

/**
 * @description Get job offer by its id.
 */
export const getJobWithRomeDetail = async (id: string | ObjectId): Promise<IJobWithRomeDetail | null> => {
  const formulaire = await getOffre(id)
  if (!formulaire) return null

  const job = formulaire.jobs.find((job) => job._id.toString() === id.toString())
  if (!job) return null

  const referentielRome = await getRomeDetailsFromDB(job.rome_code[0])

  if (!referentielRome) return null

  return { ...job, rome_detail: referentielRome }
}

const getJobOrigin = async (recruiter: IRecruiter) => {
  const userWithAccount = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(recruiter.managed_by!) })
  return (userWithAccount && userWithAccount.origin && RECRUITER_USER_ORIGIN[userWithAccount.origin]) ?? "La bonne alternance"
}

/**
 * @description Sends the mail informing the CFA that a company wants the CFA to handle the offer.
 */
export async function sendDelegationMailToCFA(email: string, offre: IJob, recruiter: IRecruiter, siret_code: string) {
  const unsubscribeOF = await getDbCollection("unsubscribedofs").findOne({ establishment_siret: siret_code })
  if (unsubscribeOF) return

  const jobOrigin = await getJobOrigin(recruiter)

  await mailer.sendEmail({
    to: email,
    subject: `Une entreprise recrute dans votre domaine`,
    template: getStaticFilePath("./templates/mail-cfa-delegation.mjml.ejs"),
    data: {
      images: { logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`, logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true` },
      enterpriseName: recruiter.establishment_raison_sociale,
      jobName: offre.offer_title_custom || offre.rome_appellation_label,
      contractType: (offre.job_type ?? []).join(", "),
      trainingLevel: offre.job_level_label,
      startDate: dayjs(offre.job_start_date).format("DD/MM/YYYY"),
      duration: offre.job_duration,
      jobOrigin,
      offerButton:
        createViewDelegationLink(email, recruiter.establishment_id, offre._id.toString(), siret_code) +
        "&utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_consulter-coord-entreprise",
      createAccountButton: `${config.publicUrl}/organisme-de-formation?utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_creer-compte`,
      policyUrl: `${config.publicUrl}/politique-de-confidentialite?utm_source=lba-brevo-transactionnel&utm_medium=email&utm_campaign=lba_cfa-mer-entreprise_politique-confidentialite`,
    },
  })
}

export async function sendMailNouvelleOffre(recruiter: IRecruiter, job: IJob, contactCFA?: IUserWithAccount) {
  const isRecruteurAwaiting = recruiter.status === RECRUITER_STATUS.EN_ATTENTE_VALIDATION
  if (isRecruteurAwaiting) {
    return
  }
  const { is_delegated, email, last_name, first_name, establishment_raison_sociale, establishment_siret } = recruiter
  const establishmentTitle = establishment_raison_sociale ?? establishment_siret
  // Send mail with action links to manage offers
  await mailer.sendEmail({
    to: is_delegated && contactCFA ? contactCFA.email : email,
    subject: is_delegated ? `Votre offre d'alternance pour ${establishmentTitle} est publiée` : `Votre offre d'alternance est publiée`,
    template: getStaticFilePath("./templates/mail-nouvelle-offre.mjml.ejs"),
    data: {
      images: { logoLba: `${config.publicUrl}/images/emails/logo_LBA.png?raw=true`, logoRf: `${config.publicUrl}/images/emails/logo_rf.png?raw=true` },
      nom: removeHtmlTagsFromString(is_delegated ? contactCFA?.last_name : last_name),
      prenom: removeHtmlTagsFromString(is_delegated ? contactCFA?.first_name : first_name),
      raison_sociale: establishmentTitle,
      mandataire: recruiter.is_delegated,
      offre: {
        rome_appellation_label: job.rome_appellation_label,
        job_type: job.job_type,
        job_level_label: job.job_level_label,
        job_start_date: dayjs(job.job_start_date).format("DD/MM/YY"),
        job_title: job.offer_title_custom,
      },
      lba_url: `${config.publicUrl}${getDirectJobPath(LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job._id.toString())}`,
    },
  })
}

export function addExpirationPeriod(fromDate: Date | dayjs.Dayjs): dayjs.Dayjs {
  return dayjs(fromDate).add(2, "months").startOf("day")
}

export const getJobFromRecruiter = (recruiter: IRecruiter, jobId: string): IJob => {
  const job = recruiter.jobs.find((job) => job._id.toString() === jobId)
  if (!job) {
    throw new Error(`could not find job with id=${jobId} in recruiter with id=${recruiter._id}`)
  }
  return job
}

export const getFormulaireFromUserId = async (userId: string) => {
  return getDbCollection("recruiters").findOne({ managed_by: userId })
}

export const getFormulaireFromUserIdWithOpco = async (userId: string, opco: OPCOS_LABEL) => {
  return getDbCollection("recruiters").findOne({ managed_by: userId, opco })
}

export const getFormulaireFromUserIdOrError = async (userId: string) => {
  const formulaire = await getFormulaireFromUserId(userId)
  if (!formulaire) {
    throw internal(`inattendu : formulaire non trouvé`, { userId })
  }
  return formulaire
}

const generateKey = (item) => `${item.libelle}-${item.code_ogr}-${item.coeur_metier}`

const filterRomeDetails = (romeDetails, competencesRome) => {
  const filteredRome: any = {}

  Object.keys(competencesRome).forEach((key) => {
    if (romeDetails[key]) {
      if (key === "savoir_etre_professionnel") {
        // Create a map of competencesRome for quick lookup
        const competencesMap = new Map(competencesRome[key].map((item) => [generateKey(item), item]))

        // Filter romeDetails based on the map created above
        filteredRome[key] = romeDetails[key].filter((item) => competencesMap.has(generateKey(item)))
      } else {
        // For savoir_faire and savoirs
        filteredRome[key] = romeDetails[key]
          .map((category) => {
            const competencesCategory = competencesRome[key].find((c) => c.libelle === category.libelle)
            if (competencesCategory) {
              // Create a map of items for quick lookup
              const competencesMap = new Map(competencesCategory.items.map((item) => [generateKey(item), item]))

              // Filter items in the category based on the map created above
              const filteredItems = category.items.filter((item) => competencesMap.has(generateKey(item)))
              return { libelle: category.libelle, items: filteredItems }
            }
          })
          // filter undefined if competencesCategory not found
          .filter((x) => x)
      }
    }
  })

  return filteredRome
}

const validateFieldsFromReferentielRome = async (job) => {
  const { competences_rome, rome_code, rome_appellation_label, rome_label } = job
  const romeDetails = await getRomeDetailsFromDB(rome_code[0])

  if (!romeDetails) {
    throw internal("unexpected: rome details not found")
  }

  const {
    competences,
    rome: { intitule },
    appellations,
  } = romeDetails

  const formatedIntituleFromRome = removeAccents(intitule.toLowerCase())
  const formatedRomeLabelFromJob = removeAccents(rome_label.toLowerCase())

  if (formatedIntituleFromRome !== formatedRomeLabelFromJob) {
    throw badRequest(`L'intitulé du code ROME ne correspond pas au référentiel : ${formatedIntituleFromRome}, reçu ${formatedRomeLabelFromJob}`)
  }

  const matchingAppellation = appellations.some((appellation) => removeAccents(appellation.libelle.toLowerCase()) === removeAccents(rome_appellation_label.toLowerCase()))

  if (!matchingAppellation) {
    throw badRequest(`L'appellation du code ROME ne correspond pas au référentiel : reçu ${removeAccents(rome_appellation_label.toLowerCase())}`)
  }

  const filteredRome = filterRomeDetails(competences, competences_rome)
  const isValid = equal(filteredRome, competences_rome)

  if (!isValid) {
    throw badRequest("compétences invalides")
  }
}

export const validateUserEmailFromJobId = async (jobId: ObjectId) => {
  const recruiterOpt = await getOffre(jobId)
  const { managed_by } = recruiterOpt ?? {}
  if (!managed_by) return
  await validateUserWithAccountEmail(new ObjectId(managed_by))
}

export const updateCfaManagedRecruiter = async (establishment_id: string, payload: Partial<IRecruiter>) => {
  const recruiter = await getDbCollection("recruiters").findOneAndUpdate({ establishment_id }, { $set: { ...payload, updatedAt: new Date() } }, { returnDocument: "after" })
  return recruiter
}

export const startRecruiterChangeStream = async () => {
  logger.info("Starting recruiter change stream")

  const recruiters = getDbCollection("recruiters")

  const changeRecruiterStream = recruiters.watch()

  changeRecruiterStream.on("change", async (change) => {
    logger.info("Change detected:", change)

    switch (change.operationType) {
      case "insert":
      case "update":
        await updateJobsPartnersFromRecruiterUpdate(change)
        break
      case "delete":
        // n'arrivera pas car les formulaires ne sont pas supprimés, mais archivés
        break
      default:
        assertUnreachable(`Unexpected change operation type ${change.operationType}` as never)
    }
  })

  // interrogation sur le côté bloquant du change stream sur
  const anonymizedRecruiters = getDbCollection("anonymized_recruiters")
  const changeAnonymizedRecruiterStream = anonymizedRecruiters.watch()
  changeAnonymizedRecruiterStream.on("change", async (change) => {
    logger.info("Change detected on anonymized recruiters:", change)

    if (change.operationType === "insert") {
      logger.info("New document inserted in anonymized:", change.fullDocument)

      await updateJobsPartnersFromRecruiterDelete(change.documentKey._id)
    }
  })
}

const updateJobsPartnersFromRecruiterUpdate = async (change: ChangeStreamUpdateDocument<IRecruiter> | ChangeStreamInsertDocument<IRecruiter>) => {
  logger.info("Updating jobs partners from recruiter update", change, change.documentKey._id)
  await updateJobsPartnersFromRecruiterById(change.documentKey._id)
}

export const updateJobsPartnersFromRecruiterById = async (recruiterId: ObjectId) => {
  logger.info("Updating jobs partners from recruiter by id", recruiterId)
  const recruiter = await getDbCollection("recruiters").findOne({ _id: recruiterId })
  logger.info("recruiter found", recruiter?.address)

  if (recruiter?.jobs?.length) {
    await asyncForEach(recruiter.jobs, async (job) => {
      const jobId = job._id.toString()
      logger.info("upserting job partners for job", jobId)
      await upsertJobPartnersFromRecruiter(recruiter, job)
    })
  }
}

function getDiplomaLevel(label: string | null | undefined): IComputedJobsPartners["offer_target_diploma"] {
  if (!label) {
    return null
  }
  switch (label) {
    case NIVEAUX_POUR_LBA["3 (CAP...)"]:
      return { european: "3", label }
    case NIVEAUX_POUR_LBA["4 (Bac, Bac pro...)"]:
      return { european: "4", label }
    case NIVEAUX_POUR_LBA["5 (BTS, DEUST...)"]:
      return { european: "5", label }
    case NIVEAUX_POUR_LBA["6 (Licence, BUT...)"]:
      return { european: "6", label }
    case NIVEAUX_POUR_LBA["7 (Master, titre ingénieur...)"]:
      return { european: "7", label }
    default:
      return null
  }
}

function getOfferStatus(job_status: JOB_STATUS, recruiter_status: RECRUITER_STATUS): JOB_STATUS_ENGLISH {
  if (recruiter_status !== RECRUITER_STATUS.ACTIF) {
    return JOB_STATUS_ENGLISH.ANNULEE
  }
  switch (job_status) {
    case JOB_STATUS.ACTIVE:
      return JOB_STATUS_ENGLISH.ACTIVE
    case JOB_STATUS.POURVUE:
      return JOB_STATUS_ENGLISH.POURVUE
    case JOB_STATUS.ANNULEE:
    case JOB_STATUS.EN_ATTENTE:
      return JOB_STATUS_ENGLISH.ANNULEE
    default:
      assertUnreachable(`Unexpected job status ${job_status} in getOfferStatus` as never)
  }
}

const upsertJobPartnersFromRecruiter = async (recruiter: IRecruiter, job: IJob) => {
  const now = new Date()

  const romeDetails = await getRomeDetailsFromDB(job.rome_code[0])

  const lbaJobContactInfo = recruiter.is_delegated ? await getLbaJobContactInfo(recruiter) : null
  const { definition, acces_metier } = romeDetails ?? {}

  const partnerJobToUpsert: Partial<IJobsPartnersOfferPrivate> = {
    _id: job._id,
    updated_at: job.job_update_date ?? now,
    created_at: job.job_creation_date ?? now,
    partner_label: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA,
    partner_job_id: job._id.toString(),
    is_delegated: recruiter.is_delegated,

    contract_start: job.job_start_date ?? null,
    contract_duration: job.job_duration ?? null,
    contract_type: job.job_type ?? [TRAINING_CONTRACT_TYPE.APPRENTISSAGE, TRAINING_CONTRACT_TYPE.PROFESSIONNALISATION],
    contract_is_disabled_elligible: job.is_disabled_elligible ?? null,
    contract_rythm: job.job_rythm ?? null,

    workplace_legal_name:
      (lbaJobContactInfo?.establishment_raison_sociale || lbaJobContactInfo?.establishment_enseigne) ??
      (recruiter.establishment_raison_sociale || recruiter.establishment_enseigne || UNKNOWN_COMPANY),
    workplace_brand: lbaJobContactInfo?.establishment_enseigne ?? recruiter.establishment_enseigne,
    workplace_siret: lbaJobContactInfo?.establishment_siret ?? recruiter.establishment_siret,
    workplace_geopoint: recruiter.geopoint ?? undefined,
    workplace_address_label: (recruiter.is_delegated ? lbaJobContactInfo?.address : recruiter.address) ?? "",
    workplace_address_zipcode: recruiter.address_detail?.code_postal ?? null,
    workplace_address_city: getCity(recruiter) ?? null,

    apply_phone: (lbaJobContactInfo ? lbaJobContactInfo?.phone : recruiter.phone) ?? null,
    apply_email: recruiter.is_delegated ? lbaJobContactInfo?.email : recruiter.email,

    workplace_opco: recruiter.opco ?? null,
    workplace_idcc: recruiter.idcc ?? null,
    workplace_naf_code: recruiter.naf_code ?? null,
    workplace_naf_label: recruiter.naf_label ?? null,
    workplace_size: recruiter.establishment_size ?? null,
    offer_origin: recruiter.origin ?? null,
    offer_target_diploma: getDiplomaLevel(job.job_level_label),
    offer_desired_skills: job.competences_rome?.savoir_etre_professionnel?.map((savoirEtre) => savoirEtre.libelle) ?? [],
    offer_to_be_acquired_skills: job.competences_rome?.savoir_faire?.map((savoirFaire) => savoirFaire.libelle) ?? [],
    offer_access_conditions: acces_metier ? [acces_metier] : [],
    offer_title: job.offer_title_custom ?? job.rome_appellation_label ?? job.rome_label ?? "Offre",
    offer_rome_codes: job.rome_code ?? null,
    offer_description: job.job_description ?? definition ?? "",
    offer_creation: job.job_creation_date,
    offer_expiration: job.job_expiration_date,
    offer_status: getOfferStatus(job.job_status, recruiter.status),
    offer_opening_count: job.job_count ?? 1,

    contract_remote: null,
    offer_status_history: [],
    workplace_address_street_label: null,
    workplace_description: null,
    workplace_name: null,
    workplace_website: null,
  }

  await getDbCollection("jobs_partners").findOneAndUpdate(
    { _id: job._id },
    {
      $set: partnerJobToUpsert,
      $setOnInsert: {
        stats_detail_view: 0,
        stats_search_view: 0,
        stats_postuler: 0,
      },
    },
    { upsert: true }
  )
  // REFLECHIR A LA REPRISE SUR INTERRUPTION
}

const updateJobsPartnersFromRecruiterDelete = async (id: ObjectId) => {
  // récupération les jobs associés au formulaire archivé
  const recruiter = await getDbCollection("anonymized_recruiters").findOne({ _id: id })

  const jobIds = recruiter?.jobs?.map((job) => job._id) ?? []

  if (jobIds.length) {
    await anonymizeLbaJobsPartners({ partner_job_ids: jobIds })
  }
}

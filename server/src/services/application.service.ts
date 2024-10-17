import { badRequest, internal, tooManyRequests } from "@hapi/boom"
import { isEmailBurner } from "burner-email-providers"
import dayjs from "dayjs"
import { ObjectId } from "mongodb"
import {
  ApplicationScanStatus,
  IApplication,
  IApplicationApiJobId,
  IApplicationApiRecruteurId,
  IApplicationPrivateCompanySiret,
  IApplicationPrivateJobId,
  IJob,
  ILbaCompany,
  INewApplicationV1,
  IRecruiter,
  JOB_STATUS,
  assertUnreachable,
} from "shared"
import { ApplicantIntention } from "shared/constants/application"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { getDirectJobPath, LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType } from "shared/constants/lbaitem"
import { RECRUITER_STATUS } from "shared/constants/recruteur"
import { prepareMessageForMail, removeUrlsFromText } from "shared/helpers/common"
import { ITrackingCookies } from "shared/models/trafficSources.model"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { z } from "zod"

import { s3Delete, s3ReadAsString, s3Write } from "@/common/utils/awsUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { UserForAccessToken, userWithAccountToUserForToken } from "@/security/accessTokenService"

import { logger } from "../common/logger"
import { manageApiError } from "../common/utils/errorManager"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import config from "../config"

import { createCancelJobLink, createProvidedJobLink, generateApplicationReplyToken } from "./appLinks.service"
import { BrevoEventStatus } from "./brevo.service"
import { isInfected } from "./clamav.service"
import { getOffreAvecInfoMandataire } from "./formulaire.service"
import mailer, { sanitizeForEmail } from "./mailer.service"
import { validateCaller } from "./queryValidator.service"
import { buildLbaCompanyAddress } from "./recruteurLba.service"
import { saveApplicationTrafficSourceIfAny } from "./trafficSource.service"

const MAX_MESSAGES_PAR_OFFRE_PAR_CANDIDAT = 3
const MAX_MESSAGES_PAR_SIRET_PAR_CALLER = 20
const MAX_CANDIDATURES_PAR_CANDIDAT_PAR_JOUR = 100

const publicUrl = config.publicUrl

const imagePath = `${config.publicUrl}/images/emails/`

const images: object = {
  images: {
    logoLba: `${imagePath}logo_LBA.png`,
    logoRF: `${imagePath}logo_rf.png`,
    logoGrimp: `${imagePath}logo_grimp.png`,
    icoInfo: `${imagePath}icone_info.png`,
    icoCandidat: `${imagePath}icone_candidat.png`,
    nspp: `${imagePath}nspp.png`,
    utile: `${imagePath}utile.png`,
    pasUtile: `${imagePath}pasUtile.png`,
    neutre: `${imagePath}neutre.png`,
    recrute: `${imagePath}recrute.png`,
    recrutePas: `${imagePath}recrutePas.png`,
    edit: `${imagePath}icone_edit.png`,
    check: `${imagePath}icone_check.png`,
    enveloppe: `${imagePath}icone_enveloppe.png`,
    bin: `${imagePath}icone_bin.png`,
    recuCandidature: `${imagePath}recu-candidature.png`,
  },
}

type IJobOrCompany = { type: LBA_ITEM_TYPE.RECRUTEURS_LBA; job: ILbaCompany; recruiter: null } | { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA; job: IJob; recruiter: IRecruiter }

/**
 * @description Get applications by job id
 */
export const getApplicationsByJobId = (job_id: IApplication["job_id"]) => getDbCollection("applications").find({ job_id }).toArray()

/**
 * @description Get applications count by job id
 */
export const getApplicationCount = (job_id: IApplication["job_id"]) => getDbCollection("applications").countDocuments({ job_id })

/**
 * @description Check if an email if blacklisted.
 * @param {string} email - Email
 * @return {Promise<boolean>}
 */
export const isEmailBlacklisted = async (email: string): Promise<boolean> => Boolean(await getDbCollection("emailblacklists").countDocuments({ email }))

/**
 * @description Add an email address to the blacklist collection.
 * @param {string} email
 * @param {string} blacklistingOrigin
 * @return {Promise<void>}
 */
export const addEmailToBlacklist = async (email: string, blacklistingOrigin: string): Promise<void> => {
  try {
    z.string().email().parse(email)

    await getDbCollection("emailblacklists").findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          blacklisting_origin: blacklistingOrigin,
        },
        $setOnInsert: { _id: new ObjectId(), created_at: new Date() },
      },
      { upsert: true }
    )
  } catch (err) {
    // catching unique address error
    logger.error(`Failed to save email to blacklist. Reason : ${err}`)
  }
}

/**
 * @description Get an application by message id
 * @param {string} messageId
 * @param {string} email
 * @returns {Promise<IApplication>}
 */
export const findApplicationByMessageId = async ({ messageId, email }: { messageId: string; email: string }) =>
  getDbCollection("applications").findOne({ company_email: email, to_company_message_id: messageId })

export const removeEmailFromLbaCompanies = async (email: string) => {
  return await getDbCollection("recruteurslba").updateMany({ email }, { $set: { email: "" } })
}

/**
 * Send an application V1
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2 and V1 support has ended
 */
export const sendApplication = async ({
  newApplication,
  referer,
}: {
  newApplication: INewApplicationV1
  referer: string | undefined
}): Promise<{ error: string } | { result: "ok"; message: "messages sent" }> => {
  if (!validateCaller({ caller: newApplication.caller, referer })) {
    return { error: "missing_caller" }
  } else {
    let validationResult = validatePermanentEmail(newApplication.applicant_email)
    if (validationResult !== "ok") {
      return { error: validationResult }
    }
    try {
      const offreOrError = await validateJob(newApplication)
      if ("error" in offreOrError) {
        return { error: offreOrError.error }
      }

      validationResult = await checkUserApplicationCount(newApplication.applicant_email.toLowerCase(), offreOrError, newApplication.caller)
      if (validationResult !== "ok") {
        return { error: validationResult }
      }

      validationResult = await scanFileContent(newApplication.applicant_file_content)
      if (validationResult !== "ok") {
        return { error: validationResult }
      }

      const { type } = offreOrError
      const recruteurEmail = (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? offreOrError.recruiter.email : offreOrError.job.email)?.toLowerCase()
      if (!recruteurEmail) {
        return { error: "email du recruteur manquant" }
      }
      const application = await newApplicationToApplicationDocument(newApplication, offreOrError, recruteurEmail)
      await s3Write("applications", getApplicationCvS3Filename(application), {
        Body: newApplication.applicant_file_content,
      })
      await getDbCollection("applications").insertOne(application)
      return { result: "ok", message: "messages sent" }
    } catch (err) {
      logger.error("Error sending application", err)
      sentryCaptureException(err)
      if (newApplication?.caller) {
        manageApiError({
          error: err,
          api_path: "applicationV1",
          caller: newApplication.caller,
          errorTitle: "error_sending_application",
        })
      }
      return { error: "error_sending_application" }
    }
  }
}

/**
 * Send an application
 */
export const sendApplicationV2 = async ({
  newApplication,
  caller,
  source,
}: {
  newApplication: IApplicationPrivateCompanySiret | IApplicationPrivateJobId | IApplicationApiRecruteurId | IApplicationApiJobId
  caller?: string
  source?: ITrackingCookies
}): Promise<{ _id: ObjectId }> => {
  let lbaJob: IJobOrCompany = { type: null as any, job: null as any, recruiter: null }

  if (isEmailBurner(newApplication.applicant_email)) {
    throw badRequest(BusinessErrorCodes.BURNER)
  }

  if ("recruteur_id" in newApplication) {
    // email can be null in collection
    const LbaRecruteur = await getDbCollection("recruteurslba").findOne({ _id: new ObjectId(newApplication.recruteur_id), email: { $not: { $eq: null } } })
    if (!LbaRecruteur) {
      throw badRequest(BusinessErrorCodes.NOTFOUND)
    }
    lbaJob = { type: LBA_ITEM_TYPE.RECRUTEURS_LBA, job: LbaRecruteur, recruiter: null }
  }

  if ("company_siret" in newApplication) {
    // email can be null in collection
    const LbaRecruteur = await getDbCollection("recruteurslba").findOne({ siret: newApplication.company_siret, email: { $not: { $eq: null } } })
    if (!LbaRecruteur) {
      throw badRequest(BusinessErrorCodes.NOTFOUND)
    }
    lbaJob = { type: LBA_ITEM_TYPE.RECRUTEURS_LBA, job: LbaRecruteur, recruiter: null }
  }

  if ("job_id" in newApplication) {
    const recruiterResult = await getOffreAvecInfoMandataire(newApplication.job_id)
    if (!recruiterResult) {
      throw badRequest(BusinessErrorCodes.NOTFOUND)
    }
    const { recruiter, job } = recruiterResult
    // la vérification sur la date accepte une période de grâce de 1j
    if (recruiter.status !== RECRUITER_STATUS.ACTIF || job.job_status !== JOB_STATUS.ACTIVE || dayjs(job.job_expiration_date).isBefore(dayjs().add(1, "day"))) {
      throw badRequest(BusinessErrorCodes.EXPIRED)
    }

    lbaJob = { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job, recruiter }
  }

  await checkUserApplicationCountV2(newApplication.applicant_email.toLowerCase(), lbaJob, caller)

  const { type, job, recruiter } = lbaJob
  const recruteurEmail = (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? recruiter.email : job.email)?.toLowerCase()
  if (!recruteurEmail) {
    sentryCaptureException(`${BusinessErrorCodes.INTERNAL_EMAIL} ${type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? `recruiter: ${recruiter._id} ` : `LbaCompany: ${job._id}`}`)
    throw internal(BusinessErrorCodes.INTERNAL_EMAIL)
  }

  try {
    const application = await newApplicationToApplicationDocumentV2(newApplication, lbaJob, caller)
    await s3Write("applications", getApplicationCvS3Filename(application), {
      Body: newApplication.applicant_file_content,
    })
    await getDbCollection("applications").insertOne(application)
    await saveApplicationTrafficSourceIfAny({ application_id: application._id, applicant_email: application.applicant_email, source })
    return { _id: application._id }
  } catch (err) {
    sentryCaptureException(err)
    if (caller) {
      manageApiError({
        error: err,
        api_path: "applicationV2",
        caller: caller,
        errorTitle: "error_sending_application",
      })
    }
    logger.error(err)
    throw badRequest(BusinessErrorCodes.UNKNOWN)
  }
}

/**
 * Build url to access item detail on LBA ui
 */
const buildUrlsOfDetail = (publicUrl: string, application: IApplication) => {
  const { job_id, company_siret } = application
  const type = job_id ? LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA : LBA_ITEM_TYPE.RECRUTEURS_LBA
  const urlSearchParams = new URLSearchParams()
  urlSearchParams.append("display", "list")
  urlSearchParams.append("page", "fiche")
  urlSearchParams.append("type", newItemTypeToOldItemType(type))
  urlSearchParams.append("itemId", job_id || company_siret)
  const paramsWithoutUtm = urlSearchParams.toString()
  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    urlSearchParams.append("utm_source", "lba")
    urlSearchParams.append("utm_medium", "email")
    urlSearchParams.append("utm_campaign", "je-candidate-recruteur")
  }
  const params = urlSearchParams.toString()
  return {
    urlWithoutUtm: `${publicUrl}/recherche-apprentissage?${paramsWithoutUtm}`,
    url: `${publicUrl}/recherche-apprentissage?${params}`,
  }
}

const buildUserForToken = (application: IApplication, user?: IUserWithAccount): UserForAccessToken => {
  const { job_origin, company_siret, company_email } = application
  if (job_origin === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return { type: "lba-company", siret: company_siret, email: company_email }
  } else if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    if (!user) {
      throw internal("un user recruteur était attendu")
    }
    return userWithAccountToUserForToken(user)
  } else {
    throw internal(`job_origin=${job_origin} non supporté`)
  }
}

const buildReplyLink = (application: IApplication, intention: ApplicantIntention, userForToken: UserForAccessToken) => {
  const applicationId = application._id.toString()
  const searchParams = new URLSearchParams()
  searchParams.append("company_recruitment_intention", intention)
  searchParams.append("id", applicationId)
  searchParams.append("fn", application.applicant_first_name)
  searchParams.append("ln", application.applicant_last_name)
  searchParams.append("utm_source", "lba")
  searchParams.append("utm_medium", "email")
  searchParams.append("utm_campaign", "je-candidate-recruteur")
  const token = generateApplicationReplyToken(userForToken, applicationId)
  searchParams.append("token", token)
  return `${config.publicUrl}/formulaire-intention?${searchParams.toString()}`
}

export const getUser2ManagingOffer = async (job: Pick<IJob, "managed_by" | "_id">): Promise<IUserWithAccount> => {
  const { managed_by } = job
  if (managed_by) {
    const user = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) })
    if (!user) {
      throw new Error(`could not find offer manager with id=${managed_by}`)
    }
    return user
  } else {
    throw new Error(`unexpected: managed_by is empty for offer with id=${job._id}`)
  }
}

/**
 * Build urls to add in email messages sent to the recruiter
 */
const buildRecruiterEmailUrls = async (application: IApplication) => {
  const { job_id } = application
  const type = job_id ? LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA : LBA_ITEM_TYPE.RECRUTEURS_LBA
  const utmRecruiterData = "&utm_source=lba&utm_medium=email&utm_campaign=je-candidate-recruteur"

  let user: IUserWithAccount | undefined
  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    const jobOrCompany = await getJobOrCompany(application)
    if (jobOrCompany.type !== LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
      throw internal(`inattendu : type !== ${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}`)
    }
    user = await getUser2ManagingOffer(jobOrCompany.job)
  }
  const userForToken = buildUserForToken(application, user)
  const urls = {
    jobUrl: "",
    meetCandidateUrl: buildReplyLink(application, ApplicantIntention.ENTRETIEN, userForToken),
    waitCandidateUrl: buildReplyLink(application, ApplicantIntention.NESAISPAS, userForToken),
    refuseCandidateUrl: buildReplyLink(application, ApplicantIntention.REFUS, userForToken),
    lbaRecruiterUrl: `${config.publicUrl}/acces-recruteur?${utmRecruiterData}`,
    unsubscribeUrl: `${config.publicUrl}/desinscription?email=${application.company_email}${utmRecruiterData}`,
    lbaUrl: `${config.publicUrl}?${utmRecruiterData}`,
    faqUrl: `${config.publicUrl}/faq?${utmRecruiterData}`,
    jobProvidedUrl: "",
    cancelJobUrl: "",
  }

  if (application.job_id && user) {
    urls.jobProvidedUrl = createProvidedJobLink(userForToken, application.job_id, utmRecruiterData)
    urls.cancelJobUrl = createCancelJobLink(userForToken, application.job_id, utmRecruiterData)
  }
  if (application.job_id) {
    urls.jobUrl = `${config.publicUrl}${getDirectJobPath(application.job_id)}${utmRecruiterData}`
  }

  return urls
}

const offreOrCompanyToCompanyFields = (LbaJob: IJobOrCompany) => {
  const { type } = LbaJob
  if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const { job } = LbaJob
    const { siret, enseigne, naf_label, phone, email } = job
    const application = {
      company_siret: siret,
      company_name: enseigne,
      company_naf: naf_label,
      company_phone: phone,
      company_email: email!,
      job_title: enseigne,
      company_address: buildLbaCompanyAddress(job),
    }
    return application
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    const { job, recruiter } = LbaJob
    const { address, is_delegated, establishment_siret, establishment_enseigne, establishment_raison_sociale, naf_label, phone, email } = recruiter
    const { rome_appellation_label, rome_label } = job
    const application = {
      company_siret: establishment_siret,
      company_name: establishment_enseigne || establishment_raison_sociale || "Enseigne inconnue",
      company_naf: naf_label ?? "",
      company_phone: phone,
      company_email: email,
      job_title: rome_appellation_label ?? rome_label ?? undefined,
      company_address: is_delegated ? null : address,
      job_id: job._id.toString(),
    }
    return application
  } else {
    assertUnreachable(type)
  }
}

const cleanApplicantFields = (newApplication: INewApplicationV1) => {
  return {
    applicant_first_name: newApplication.applicant_first_name,
    applicant_last_name: newApplication.applicant_last_name,
    applicant_attachment_name: newApplication.applicant_file_name,
    applicant_email: newApplication.applicant_email.toLowerCase(),
    applicant_message_to_company: prepareMessageForMail(newApplication.message),
    applicant_phone: newApplication.applicant_phone,
    caller: newApplication.caller,
  }
}

/**
 * @description Initialize application object from query parameters
 */
const newApplicationToApplicationDocument = async (newApplication: INewApplicationV1, offreOrCompany: IJobOrCompany, recruteurEmail: string) => {
  const now = new Date()
  const application: IApplication = {
    ...offreOrCompanyToCompanyFields(offreOrCompany),
    ...cleanApplicantFields(newApplication),
    company_email: recruteurEmail.toLowerCase(),
    company_recruitment_intention: null,
    company_feedback: null,
    job_origin: newApplication.company_type,
    _id: new ObjectId(),
    created_at: now,
    last_update_at: now,
    to_applicant_message_id: null,
    to_company_message_id: null,
    scan_status: ApplicationScanStatus.WAITING_FOR_SCAN,
  }
  return application
}

/**
 * @description Initialize application object from query parameters
 */
const newApplicationToApplicationDocumentV2 = async (
  newApplication: IApplicationApiRecruteurId | IApplicationApiJobId | IApplicationPrivateCompanySiret | IApplicationPrivateJobId,
  LbaJob: IJobOrCompany,
  caller?: string
) => {
  const now = new Date()
  const application: IApplication = {
    ...offreOrCompanyToCompanyFields(LbaJob),
    applicant_first_name: newApplication.applicant_first_name,
    applicant_last_name: newApplication.applicant_last_name,
    applicant_attachment_name: newApplication.applicant_file_name,
    applicant_email: newApplication.applicant_email.toLowerCase(),
    applicant_message_to_company: prepareMessageForMail(newApplication.applicant_message),
    applicant_phone: newApplication.applicant_phone,
    job_searched_by_user: "job_searched_by_user" in newApplication ? newApplication.job_searched_by_user : null,
    company_recruitment_intention: null,
    company_feedback: null,
    caller: caller,
    job_origin: LbaJob.type,
    _id: new ObjectId(),
    created_at: now,
    last_update_at: now,
    to_applicant_message_id: null,
    to_company_message_id: null,
    scan_status: ApplicationScanStatus.WAITING_FOR_SCAN,
  }
  return application
}

/**
 * @description Return template file path for given type
 */
export const getEmailTemplate = (type = "mail-candidat"): string => {
  return getStaticFilePath(`./templates/${type}.mjml.ejs`)
}

/**
 * @description checks if job applied to is valid
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2 and V1 support has ended
 */
export const validateJob = async (application: INewApplicationV1): Promise<IJobOrCompany | { error: string }> => {
  const { company_type, job_id, company_siret } = application

  if (company_type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    if (!job_id) {
      return { error: "job_id manquant" }
    }
    const recruiterResult = await getOffreAvecInfoMandataire(job_id)
    if (!recruiterResult) {
      return { error: "offre manquante" }
    }
    const { recruiter, job } = recruiterResult
    if (recruiter.status !== RECRUITER_STATUS.ACTIF || job.job_status !== JOB_STATUS.ACTIVE) {
      return { error: "offre expirée" }
    }
    return { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job, recruiter }
  } else if (company_type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    if (!company_siret) {
      return { error: "company_siret manquant" }
    }
    const lbaCompany = await getDbCollection("recruteurslba").findOne({ siret: company_siret })
    if (!lbaCompany) {
      return { error: "société manquante" }
    }
    return { type: LBA_ITEM_TYPE.RECRUTEURS_LBA, job: lbaCompany, recruiter: null }
  } else {
    assertUnreachable(company_type as never)
  }
}

/**
 * @description checks if attachment is corrupted
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2 and V1 support has ended
 */
const scanFileContent = async (applicant_file_content: string): Promise<string> => {
  return (await isInfected(applicant_file_content)) ? "pièce jointe invalide" : "ok"
}

/**
 * checks if email is not disposable
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2 and V1 support has ended
 */
export const validatePermanentEmail = (email: string): string => {
  if (isEmailBurner(email)) {
    return "email temporaire non autorisé"
  }
  return "ok"
}

async function getApplicationCountForItem(applicantEmail: string, LbaJob: IJobOrCompany) {
  const { type, job } = LbaJob

  if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return getDbCollection("applications").countDocuments({
      applicant_email: applicantEmail.toLowerCase(),
      company_siret: job.siret,
    })
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    return getDbCollection("applications").countDocuments({
      applicant_email: applicantEmail.toLowerCase(),
      job_id: job._id.toString(),
    })
  } else {
    assertUnreachable(type)
  }
}

/**
 * @description checks if email's owner has not sent more than allowed count of applications per day
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2 and V1 support has ended
 */
const checkUserApplicationCount = async (applicantEmail: string, offreOrCompany: IJobOrCompany, caller: string | null | undefined): Promise<string> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const { type } = offreOrCompany

  const [todayApplicationsCount, itemApplicationCount, callerApplicationCount] = await Promise.all([
    getDbCollection("applications").countDocuments({
      applicant_email: applicantEmail.toLowerCase(),
      created_at: { $gte: start, $lt: end },
    }),
    getApplicationCountForItem(applicantEmail, offreOrCompany),
    caller
      ? getDbCollection("applications").countDocuments({
          caller: caller.toLowerCase(),
          company_siret: type === LBA_ITEM_TYPE.RECRUTEURS_LBA ? offreOrCompany.job.siret : offreOrCompany.recruiter.establishment_siret,
          created_at: { $gte: start, $lt: end },
        })
      : 0,
  ])

  if (todayApplicationsCount > MAX_CANDIDATURES_PAR_CANDIDAT_PAR_JOUR) {
    return BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_DAY
  }

  if (itemApplicationCount >= MAX_MESSAGES_PAR_OFFRE_PAR_CANDIDAT) {
    return BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_OFFER
  }

  if (callerApplicationCount >= MAX_MESSAGES_PAR_SIRET_PAR_CALLER) {
    return BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_SIRET
  }

  return "ok"
}

/**
 * @description checks if email's owner has not sent more than allowed count of applications per day
 */
const checkUserApplicationCountV2 = async (applicantEmail: string, LbaJob: IJobOrCompany, caller?: string): Promise<void> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const { type, job, recruiter } = LbaJob

  const [todayApplicationsCount, itemApplicationCount, callerApplicationCount] = await Promise.all([
    getDbCollection("applications").countDocuments({
      applicant_email: applicantEmail.toLowerCase(),
      created_at: { $gte: start, $lt: end },
    }),
    getApplicationCountForItem(applicantEmail, LbaJob),
    caller
      ? getDbCollection("applications").countDocuments({
          caller,
          company_siret: type === LBA_ITEM_TYPE.RECRUTEURS_LBA ? job.siret : recruiter.establishment_siret,
          created_at: { $gte: start, $lt: end },
        })
      : 0,
  ])

  if (todayApplicationsCount > MAX_CANDIDATURES_PAR_CANDIDAT_PAR_JOUR) {
    throw tooManyRequests(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_DAY)
  }

  if (itemApplicationCount >= MAX_MESSAGES_PAR_OFFRE_PAR_CANDIDAT) {
    throw tooManyRequests(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_OFFER)
  }

  if (callerApplicationCount >= MAX_MESSAGES_PAR_SIRET_PAR_CALLER) {
    throw tooManyRequests(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_SIRET)
  }
}

/**
 * @description sends notification email to applicant
 */
export const sendMailToApplicant = async ({
  application,
  email,
  phone,
  company_recruitment_intention,
  company_feedback,
}: {
  application: IApplication
  email: string | null
  phone: string | null
  company_recruitment_intention: string
  company_feedback: string
}): Promise<void> => {
  switch (company_recruitment_intention) {
    case ApplicantIntention.ENTRETIEN: {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse positive de ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-entretien"),
        data: { ...sanitizeApplicationForEmail(application), ...images, email, phone: sanitizeForEmail(removeUrlsFromText(phone)), comment: sanitizeForEmail(company_feedback) },
      })
      break
    }
    case ApplicantIntention.NESAISPAS: {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse de ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-nsp"),
        data: { ...sanitizeApplicationForEmail(application), ...images, email, phone: sanitizeForEmail(removeUrlsFromText(phone)), comment: sanitizeForEmail(company_feedback) },
      })
      break
    }
    case ApplicantIntention.REFUS: {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse négative de ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-refus"),
        data: { ...sanitizeApplicationForEmail(application), ...images, comment: sanitizeForEmail(company_feedback) },
      })
      break
    }
    default:
      break
  }
}

/**
 * @description triggers action from hardbounce webhook
 */
export const sendNotificationForApplicationHardbounce = async ({ application }: { payload: any; application: IApplication }): Promise<void> => {
  if (application.job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    await warnMatchaTeamAboutBouncedEmail({ application })
  }

  await notifyHardbounceToApplicant({ application })
}

/**
 * sends email notification to applicant if it's application hardbounced
 */
const notifyHardbounceToApplicant = async ({ application }: { application: IApplication | any }): Promise<void> => {
  await mailer.sendEmail({
    to: application.applicant_email,
    subject: `Votre candidature n'a pas pu être envoyée à ${application.company_name}`,
    template: getEmailTemplate("mail-candidat-hardbounce"),
    data: { ...sanitizeApplicationForEmail(application), ...images },
  })
}

/**
 * sends email notification to applicant if it's application hardbounced
 */
const warnMatchaTeamAboutBouncedEmail = async ({ application }: { application: IApplication | any }): Promise<void> => {
  await mailer.sendEmail({
    to: config.transactionalEmail,
    subject: `Votre candidature n'a pas pu être envoyée à ${application.company_name}`,
    template: getEmailTemplate("mail-matcha-hardbounce"),
    data: { ...sanitizeApplicationForEmail(application), ...images },
  })
}

export interface IApplicationCount {
  _id: string
  count: number
}

/**
 * @description retourne le nombre de candidatures enregistrées par identifiant d'offres lba fournis
 * @param {IJobs["_id"][]} job_ids
 * @returns {Promise<IApplicationCount[]>} token data
 */
export const getApplicationByJobCount = async (job_ids: IApplication["job_id"][]): Promise<IApplicationCount[]> => {
  const applicationCountByJob = (await getDbCollection("applications")
    .aggregate([
      {
        $match: {
          job_id: { $in: job_ids },
        },
      },
      {
        $group: {
          _id: "$job_id",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray()) as IApplicationCount[]

  return applicationCountByJob
}

/**
 * @description retourne le nombre de candidatures enregistrées par siret de société fournis
 * @param {ILbaCompany["siret"][]} sirets
 * @returns {Promise<IApplicationCount[]>} token data
 */
export const getApplicationByCompanyCount = async (sirets: ILbaCompany["siret"][]): Promise<IApplicationCount[]> => {
  const applicationCountByCompany = (await getDbCollection("applications")
    .aggregate([
      {
        $match: {
          company_siret: { $in: sirets },
        },
      },
      {
        $group: {
          _id: "$company_siret",
          count: { $sum: 1 },
        },
      },
    ])
    .toArray()) as IApplicationCount[]

  return applicationCountByCompany
}

/**
 *  if hardbounce event si related to an application sent to a compay then
 * warns the applicant and returns true otherwise returns false
 */
export const processApplicationHardbounceEvent = async (payload) => {
  const { event, email } = payload
  const messageId = payload["message-id"]

  // application
  if (event === BrevoEventStatus.HARD_BOUNCE) {
    const application = await findApplicationByMessageId({
      messageId,
      email,
    })

    if (application) {
      await sendNotificationForApplicationHardbounce({ payload, application })
      return true
    }
  }

  return false
}

export const obfuscateLbaCompanyApplications = async (company_siret: string) => {
  const fakeEmail = "faux_email@faux-domaine-compagnie.com"
  await getDbCollection("applications").updateMany(
    { job_origin: { $in: [LBA_ITEM_TYPE_OLD.LBA, LBA_ITEM_TYPE.RECRUTEURS_LBA] }, company_siret },
    { $set: { to_company_message_id: fakeEmail, company_email: fakeEmail } }
  )
}

const sanitizeApplicationForEmail = (application: IApplication) => {
  const {
    applicant_email,
    applicant_first_name,
    applicant_last_name,
    applicant_phone,
    applicant_attachment_name,
    applicant_message_to_company,
    company_recruitment_intention,
    company_feedback,
    company_feedback_date,
    company_siret,
    company_email,
    company_phone,
    company_name,
    company_naf,
    company_address,
    job_origin,
    job_title,
    job_id,
    caller,
    created_at,
    last_update_at,
    job_searched_by_user,
  } = application
  return {
    applicant_email: sanitizeForEmail(applicant_email),
    applicant_first_name: sanitizeForEmail(applicant_first_name),
    applicant_last_name: sanitizeForEmail(applicant_last_name),
    applicant_phone: sanitizeForEmail(applicant_phone),
    applicant_attachment_name: sanitizeForEmail(applicant_attachment_name),
    job_searched_by_user: sanitizeForEmail(job_searched_by_user),
    applicant_message_to_company: sanitizeForEmail(applicant_message_to_company, "keepBr"),
    company_recruitment_intention: sanitizeForEmail(company_recruitment_intention),
    company_feedback: sanitizeForEmail(company_feedback),
    company_feedback_date: company_feedback_date,
    company_siret: company_siret,
    company_email: sanitizeForEmail(company_email),
    company_phone: sanitizeForEmail(company_phone),
    company_name: company_name,
    company_naf: company_naf,
    company_address: company_address,
    job_origin: job_origin,
    job_title: sanitizeForEmail(job_title),
    job_id: job_id,
    caller: sanitizeForEmail(caller),
    created_at: created_at,
    last_update_at: last_update_at,
  }
}

const getApplicationCvS3Filename = (application: IApplication) => `cv-${application._id}`

const getApplicationAttachmentContent = async (application: IApplication): Promise<string> => {
  const content = await s3ReadAsString("applications", getApplicationCvS3Filename(application))
  if (!content) {
    throw internal(`inattendu : cv vide pour la candidature avec id=${application._id}`)
  }
  return content
}

export const processApplicationScanForVirus = async (application: IApplication) => {
  const fileContent = await getApplicationAttachmentContent(application)
  const hasVirus = await isInfected(fileContent)
  await getDbCollection("applications").findOneAndUpdate(
    { _id: application._id },
    { $set: { scan_status: hasVirus ? ApplicationScanStatus.VIRUS_DETECTED : ApplicationScanStatus.NO_VIRUS_DETECTED } }
  )

  if (hasVirus) {
    const { url: urlOfDetail, urlWithoutUtm: urlOfDetailNoUtm } = buildUrlsOfDetail(publicUrl, application)
    await mailer.sendEmail({
      to: application.applicant_email,
      subject: "Echec d'envoi de votre candidature",
      template: getEmailTemplate("mail-echec-envoi-candidature"),
      data: {
        ...sanitizeApplicationForEmail(application),
        ...images,
        urlOfDetail,
        urlOfDetailNoUtm,
      },
    })
  }

  return hasVirus
}

export const deleteApplicationCvFile = async (application: IApplication) => {
  await s3Delete("applications", getApplicationCvS3Filename(application))
}

export const processApplicationEmails = {
  async sendEmailsIfNeeded(application: IApplication) {
    const { to_company_message_id, to_applicant_message_id } = application
    const attachmentContent = await getApplicationAttachmentContent(application)
    if (!to_company_message_id) {
      await this.sendRecruteurEmail(application, attachmentContent)
    }
    if (!to_applicant_message_id) {
      await this.sendCandidatEmail(application)
    }
  },
  async sendRecruteurEmail(application: IApplication, attachmentContent: string) {
    const { job_id } = application
    const type = job_id ? LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA : LBA_ITEM_TYPE.RECRUTEURS_LBA
    const { url: urlOfDetail, urlWithoutUtm: urlOfDetailNoUtm } = buildUrlsOfDetail(publicUrl, application)
    const recruiterEmailUrls = await buildRecruiterEmailUrls(application)

    const emailCompany = await mailer.sendEmail({
      to: application.company_email,
      subject: type === LBA_ITEM_TYPE.RECRUTEURS_LBA ? `Candidature spontanée en alternance ${application.company_name}` : `Candidature en alternance - ${application.job_title}`,
      template: getEmailTemplate(type === LBA_ITEM_TYPE.RECRUTEURS_LBA ? "mail-candidature-spontanee" : "mail-candidature"),
      data: {
        ...sanitizeApplicationForEmail(application),
        ...images,
        ...recruiterEmailUrls,
        urlOfDetail,
        urlOfDetailNoUtm,
      },
      attachments: [
        {
          filename: application.applicant_attachment_name,
          path: attachmentContent,
        },
      ],
    })
    if (emailCompany?.accepted?.length) {
      await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { to_company_message_id: emailCompany.messageId } })
    } else {
      logger.error(`Application email rejected. applicant_email=${application.applicant_email} company_email=${application.company_email}`)
      throw internal("Email entreprise destinataire rejeté.")
    }
  },
  async sendCandidatEmail(application: IApplication) {
    const { job_id } = application
    const type = job_id ? LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA : LBA_ITEM_TYPE.RECRUTEURS_LBA
    const { url: urlOfDetail, urlWithoutUtm: urlOfDetailNoUtm } = buildUrlsOfDetail(publicUrl, application)
    const emailCandidat = await mailer.sendEmail({
      to: application.applicant_email,
      subject: `Votre candidature chez ${application.company_name}`,
      template: getEmailTemplate(type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? "mail-candidat-offre-emploi-lba" : "mail-candidat-recruteur-lba"),
      data: {
        ...sanitizeApplicationForEmail(application),
        ...images,
        publicUrl,
        urlOfDetail,
        urlOfDetailNoUtm,
        applicationWebsiteOrigin: getApplicationWebsiteOrigin(application.caller),
        applicationDate: dayjs(application.created_at).format("DD/MM/YYYY"),
        reminderDate: dayjs(application.created_at).add(10, "days").format("DD/MM/YYYY"),
        attachmentName: application.applicant_attachment_name,
      },
    })
    if (emailCandidat?.accepted?.length) {
      await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { to_applicant_message_id: emailCandidat.messageId } })
    } else {
      logger.error(`Application email rejected. applicant_email=${application.applicant_email} company_email=${application.company_email}`)
      throw internal("Email candidat destinataire rejeté.")
    }
  },
}

const getApplicationWebsiteOrigin = (caller: IApplication["caller"]) => {
  switch (caller) {
    case "1jeune1solution":
      return " par 1jeune1solution"
    case "oc":
    case "openclassrooms":
      return " par OpenClassrooms"

    default:
      return ""
  }
}

const getJobOrCompany = async (application: IApplication): Promise<IJobOrCompany> => {
  const { job_id, company_siret } = application
  if (job_id) {
    const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": new ObjectId(job_id) })
    if (!recruiter) {
      throw internal(`inattendu: aucun recruiter avec jobs._id=${job_id}`)
    }
    const job = recruiter?.jobs?.find((job) => job._id.toString() === job_id)
    if (!job) {
      throw internal(`inattendu: aucun job avec id=${job_id}`)
    }
    return { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job, recruiter }
  } else {
    const company = await getDbCollection("recruteurslba").findOne({ siret: company_siret })
    if (!company) {
      throw internal(`inattendu: aucun recruteur lba avec siret=${company_siret}`)
    }
    return { type: LBA_ITEM_TYPE.RECRUTEURS_LBA, job: company, recruiter: null }
  }
}

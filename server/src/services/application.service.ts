import { Transform } from "stream"
import { pipeline } from "stream/promises"

import { badRequest, internal, notFound, tooManyRequests } from "@hapi/boom"
import { isEmailBurner } from "burner-email-providers"
import dayjs from "dayjs"
import { fileTypeFromBuffer } from "file-type"
import { ObjectId } from "mongodb"
import {
  ApplicationScanStatus,
  CompanyFeebackSendStatus,
  EMAIL_LOG_TYPE,
  IApplicant,
  IApplication,
  IApplicationApiPrivateOutput,
  IApplicationApiPublicOutput,
  IJob,
  INewApplicationV1,
  IRecruiter,
  JOB_STATUS,
  JobCollectionName,
  assertUnreachable,
  parseEnum,
} from "shared"
import { ApplicationIntention, ApplicationIntentionDefaultText, RefusalReasons } from "shared/constants/application"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE, UNKNOWN_COMPANY } from "shared/constants/lbaitem"
import { CFA, ENTREPRISE, RECRUITER_STATUS } from "shared/constants/recruteur"
import { prepareMessageForMail, removeUrlsFromText } from "shared/helpers/common"
import { getDirectJobPath } from "shared/metier/lbaitemutils"
import { IJobsPartnersOfferPrivate, JOBPARTNERS_LABEL } from "shared/models/jobsPartners.model"
import { ITrackingCookies } from "shared/models/trafficSources.model"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { z } from "zod"

import { s3Delete, s3ReadAsString, s3WriteString } from "@/common/utils/awsUtils"
import { getStaticFilePath } from "@/common/utils/getStaticFilePath"
import { createToken, getTokenValue } from "@/common/utils/jwtUtils"
import { getDbCollection } from "@/common/utils/mongodbUtils"
import { notifyToSlack } from "@/common/utils/slackUtils"
import { UserForAccessToken, userWithAccountToUserForToken } from "@/security/accessTokenService"

import { logger } from "../common/logger"
import { manageApiError } from "../common/utils/errorManager"
import { sentryCaptureException } from "../common/utils/sentryUtils"
import { sanitizeTextField } from "../common/utils/stringUtils"
import config from "../config"

import { getApplicantFromDB, getOrCreateApplicant } from "./applicant.service"
import { createCancelJobLink, createProvidedJobLink, generateApplicationReplyToken } from "./appLinks.service"
import { BrevoEventStatus } from "./brevo.service"
import { isInfected } from "./clamav.service"
import { getOffreAvecInfoMandataire } from "./formulaire.service"
import mailer from "./mailer.service"
import { validateCaller } from "./queryValidator.service"
import { saveApplicationTrafficSourceIfAny } from "./trafficSource.service"
import { validateUserWithAccountEmail } from "./userWithAccount.service"

const MAX_MESSAGES_PAR_OFFRE_PAR_CANDIDAT = 3
const MAX_MESSAGES_PAR_SIRET_PAR_CALLER = 20
const MAX_CANDIDATURES_PAR_CANDIDAT_PAR_JOUR = 100

const publicUrl = config.publicUrl

const imagePath = `${config.publicUrl}/images/emails/`

const PARTNER_NAMES = {
  oc: "OpenClassrooms",
  "1jeune1solution": "1jeune1solution",
}

const images: object = {
  images: {
    logoLba: `${imagePath}logo_LBA.png`,
    logoRf: `${imagePath}logo_rf.png`,
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

type IJobOrCompanyV2 =
  | { type: LBA_ITEM_TYPE.RECRUTEURS_LBA; job: IJobsPartnersOfferPrivate; recruiter: null }
  | { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA; job: IJob; recruiter: IRecruiter }
  | { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES; job: IJobsPartnersOfferPrivate; recruiter: null }

export enum BlackListOrigins {
  CANDIDATURE_SPONTANEE_RECRUTEUR = "candidature_spontanee_recruteur",
  CANDIDATURE_SPONTANEE_CANDIDAT = "candidature_spontanee_candidat",
  PRDV_CFA = "prise_de_rdv_CFA",
  PRDV_CANDIDAT = "prise_de_rdv_candidat",
  PRDV_INVITATION = "prise_de_rdv_invitation",
  USER_WITH_ACCOUNT = "user_with_account",
  CAMPAIGN = "campaign",
  UNKNOWN = "unknown",
}

const emailCandidatTemplateMap = {
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: "mail-candidat-offre-emploi-lba",
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: "mail-candidat-offre-emploi-partenaire",
  [LBA_ITEM_TYPE.RECRUTEURS_LBA]: "mail-candidat-recruteur-lba",
}

const emailCandidatureTemplateMap = {
  [LBA_ITEM_TYPE.RECRUTEURS_LBA]: "mail-candidature-spontanee",
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES]: "mail-candidature-partenaire",
  [LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA]: "mail-candidature",
}

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
export const isEmailBlacklisted = async (email: string): Promise<boolean> => Boolean(await getDbCollection("emailblacklists").findOne({ email }))

/**
 * @description Add an email address to the blacklist collection.
 * @param {string} email
 * @param {string} blacklistingOrigin
 * @return {Promise<void>}
 */
export const addEmailToBlacklist = async (email: string, blacklistingOrigin: BlackListOrigins, event: BrevoEventStatus): Promise<void> => {
  try {
    z.string().email().parse(email)

    await getDbCollection("emailblacklists").findOneAndUpdate(
      { email },
      {
        $set: {
          email,
          blacklisting_origin: `${blacklistingOrigin} (${event})`,
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

export const findApplicationByMessageId = async ({ messageId, email }: { messageId: string; email: string }) =>
  getDbCollection("applications").findOne({ company_email: email, to_company_message_id: messageId })

export const removeEmailFromLbaCompanies = async (email: string) => {
  return await getDbCollection("jobs_partners").updateMany({ email, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA }, { $set: { email: "" } })
}

/**
 * Send an application V1
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2 and V1 support has ended
 */
// get data from applicant
export const sendApplication = async ({
  newApplication,
  referer,
}: {
  newApplication: INewApplicationV1
  referer: string | undefined
}): Promise<{ error: string } | { result: "ok"; message: "messages sent" }> => {
  const { applicant_email, applicant_first_name, applicant_last_name, applicant_phone } = newApplication
  if (!validateCaller({ caller: newApplication.caller, referer })) {
    return { error: "missing_caller" }
  } else {
    let validationResult = validatePermanentEmail(applicant_email)
    if (validationResult !== "ok") {
      return { error: validationResult }
    }
    // function to get or create applicant
    const applicant = await getOrCreateApplicant({
      email: applicant_email,
      firstname: applicant_first_name,
      lastname: applicant_last_name,
      phone: applicant_phone,
    })

    try {
      const offreOrError = await validateJob(newApplication)
      if ("error" in offreOrError) {
        return { error: offreOrError.error }
      }

      validationResult = await checkUserApplicationCount(applicant._id, offreOrError, newApplication.caller)
      if (validationResult !== "ok") {
        return { error: validationResult }
      }

      validationResult = await scanFileContent(newApplication.applicant_file_content)
      if (validationResult !== "ok") {
        return { error: validationResult }
      }

      const { type, job, recruiter } = offreOrError
      const recruteurEmail = (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? recruiter.email : job.apply_email)?.toLowerCase()
      if (!recruteurEmail) {
        return { error: "email du recruteur manquant" }
      }
      const application = await newApplicationToApplicationDocument(newApplication, applicant, offreOrError, recruteurEmail)
      await s3WriteString("applications", getApplicationCvS3Filename(application), {
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

async function identifyFileType(base64String: string) {
  try {
    // Remove the data URL part if it's present
    const base64Data = base64String.replace(/^data:[^;]+;base64,/, "")
    // Convert base64 string to a buffer
    const buffer = Buffer.from(base64Data, "base64")
    // Get the file type from the buffer
    const type = await fileTypeFromBuffer(buffer)
    return type
  } catch (err) {
    return undefined
  }
}

async function validateApplicationFileType(base64String: string) {
  const type = await identifyFileType(base64String)
  if (!type) {
    sentryCaptureException("Application file type could not be determined", { extra: { responseData: base64String } })
    throw badRequest(BusinessErrorCodes.FILE_TYPE_NOT_SUPPORTED)
  }

  if (!["pdf", "docx"].includes(type?.ext)) {
    sentryCaptureException("Application file type not supported", { extra: { responseData: type } })
    throw badRequest(BusinessErrorCodes.FILE_TYPE_NOT_SUPPORTED)
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
  newApplication: IApplicationApiPublicOutput | IApplicationApiPrivateOutput
  caller?: string
  source?: ITrackingCookies
}): Promise<{ _id: ObjectId }> => {
  let lbaJob: IJobOrCompanyV2 = { type: null as any, job: null as any, recruiter: null }
  const {
    recipient_id: { collectionName, jobId },
    applicant_attachment_content,
    applicant_email,
    applicant_first_name,
    applicant_last_name,
    applicant_phone,
  } = newApplication

  await validateApplicationFileType(applicant_attachment_content)

  if (isEmailBurner(applicant_email)) {
    throw badRequest(BusinessErrorCodes.BURNER)
  }

  const applicant = await getOrCreateApplicant({
    email: applicant_email,
    firstname: applicant_first_name,
    lastname: applicant_last_name,
    phone: applicant_phone,
  })

  if (collectionName === JobCollectionName.recruiters) {
    const recruiterResult = await getOffreAvecInfoMandataire(jobId)
    if (!recruiterResult) {
      throw badRequest(BusinessErrorCodes.NOTFOUND)
    }
    const { recruiter, job } = recruiterResult
    // la vérification sur la date accepte une période de grâce de 1j
    if (recruiter.status !== RECRUITER_STATUS.ACTIF || job.job_status !== JOB_STATUS.ACTIVE || dayjs(job.job_expiration_date).add(1, "day").isBefore(dayjs())) {
      throw badRequest(BusinessErrorCodes.EXPIRED)
    }
    lbaJob = { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job, recruiter }
  }
  if (collectionName === JobCollectionName.partners) {
    const job = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(jobId) })
    if (!job) {
      throw badRequest(BusinessErrorCodes.NOTFOUND)
    }
    lbaJob = { type: job.partner_label === LBA_ITEM_TYPE.RECRUTEURS_LBA ? LBA_ITEM_TYPE.RECRUTEURS_LBA : LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, job, recruiter: null }
  }
  if (collectionName === JobCollectionName.recruteur) {
    const job = await getDbCollection("jobs_partners").findOne({ workplace_siret: jobId })
    if (!job) {
      throw badRequest(BusinessErrorCodes.NOTFOUND)
    }
    lbaJob = { type: LBA_ITEM_TYPE.RECRUTEURS_LBA, job, recruiter: null }
  }

  await checkUserApplicationCountV2(applicant._id, lbaJob, caller)

  const { type, job, recruiter } = lbaJob
  const recruteurEmail = (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? recruiter.email : job.apply_email)?.toLowerCase()
  if (!recruteurEmail) {
    sentryCaptureException(`${BusinessErrorCodes.INTERNAL_EMAIL} ${type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? `recruiter: ${recruiter._id} ` : `LbaCompany: ${job._id}`}`)
    throw internal(BusinessErrorCodes.INTERNAL_EMAIL)
  }

  try {
    // add applicant_id to application
    const application = await newApplicationToApplicationDocumentV2(newApplication, applicant, lbaJob, caller)
    await s3WriteString("applications", getApplicationCvS3Filename(application), {
      Body: applicant_attachment_content,
    })
    await getDbCollection("applications").insertOne(application)
    await saveApplicationTrafficSourceIfAny({ application_id: application._id, applicant_email: applicant.email, source })
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
 * email PJ contient un virus
 * email candidat et recruteur lors d'une candidature
 */
const buildUrlsOfDetail = (application: IApplication, utm?: { utm_source?: string; utm_medium?: string; utm_campaign?: string }) => {
  const { job_id, company_siret, job_origin, job_title } = application
  const defaultUtm = { utm_source: "lba", utm_medium: "email", utm_campaign: "je-candidate" }
  const { utm_campaign, utm_medium, utm_source } = { ...defaultUtm, ...utm }
  const idInUrl = job_origin === LBA_ITEM_TYPE.RECRUTEURS_LBA ? company_siret! : job_id!
  const urlWithoutUtm = `${publicUrl}${getDirectJobPath(job_origin, idInUrl, job_title ?? undefined)}`

  const searchParams = new URLSearchParams()
  searchParams.append("utm_source", utm_source)
  searchParams.append("utm_medium", utm_medium)
  if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    searchParams.append("utm_campaign", utm_campaign)
  }
  if (job_origin === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    searchParams.append("utm_campaign", `${utm_campaign}-spontanement`)
  }
  if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    searchParams.append("utm_campaign", `${utm_campaign}-partenaire`)
  }
  return {
    urlWithoutUtm,
    url: `${urlWithoutUtm}?${searchParams}`,
  }
}

export const buildUserForToken = (application: IApplication, user?: IUserWithAccount): UserForAccessToken => {
  const { job_origin, company_siret, company_email, job_id } = application
  if (job_origin === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return { type: "lba-company", siret: company_siret!, email: company_email }
  } else if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    if (!user) {
      throw internal("un user recruteur était attendu")
    }
    return userWithAccountToUserForToken(user)
  } else if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    return { type: "partenaire", jobId: job_id!, email: company_email } // need more ??
  } else {
    throw internal(`job_origin=${job_origin} non supporté`)
  }
}

// get data from applicant
const buildReplyLink = (application: IApplication, applicant: IApplicant, intention: ApplicationIntention, userForToken: UserForAccessToken) => {
  const { job_origin, _id } = application
  const applicationId = _id.toString()
  const searchParams = new URLSearchParams()
  searchParams.append("company_recruitment_intention", intention)
  searchParams.append("id", applicationId)
  searchParams.append("utm_source", "lba")
  searchParams.append("utm_medium", "email")
  if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    searchParams.append("utm_campaign", "je-candidate-recruteur")
  } else if (job_origin === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    searchParams.append("utm_campaign", "je-candidate-spontanement-recruteur")
  } else if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    searchParams.append("utm_campaign", "je-candidate-partenaire")
  }
  const token = generateApplicationReplyToken(userForToken, applicationId, intention)
  searchParams.append("token", token)
  return `${config.publicUrl}/formulaire-intention?${searchParams.toString()}`
}

export const getUserManagingOffer = async (recruiter: IRecruiter): Promise<IUserWithAccount> => {
  const { managed_by } = recruiter
  const user = await getDbCollection("userswithaccounts").findOne({ _id: new ObjectId(managed_by) })
  if (!user) {
    throw new Error(`could not find offer manager with id=${managed_by}`)
  }
  return user
}

/**
 * Build urls to add in email messages sent to the recruiter
 * email recruteur uniquement
 */
const buildRecruiterEmailUrlsAndParameters = async (application: IApplication, applicant: IApplicant) => {
  const utmRecruiterData = "&utm_source=lba&utm_medium=email&utm_campaign=je-candidate-recruteur"

  let user: IUserWithAccount | undefined
  let jobPartnerLabel = ""
  if (application.job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    const jobOrCompany = await getJobOrCompany(application)
    if (jobOrCompany.type !== LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
      throw internal(`inattendu : type !== ${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}`)
    }
    user = await getUserManagingOffer(jobOrCompany.recruiter)
  }
  if (application.job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    const jobOrCompany = await getJobOrCompany(application)
    jobPartnerLabel = (jobOrCompany.type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES && jobOrCompany?.job?.partner_label) || ""
  }
  const userForToken = buildUserForToken(application, user)
  const urls = {
    jobUrl: "",
    meetCandidateUrl: buildReplyLink(application, applicant, ApplicationIntention.ENTRETIEN, userForToken),
    refuseCandidateUrl: buildReplyLink(application, applicant, ApplicationIntention.REFUS, userForToken),
    lbaRecruiterUrl: `${config.publicUrl}/acces-recruteur?${utmRecruiterData}-acces-recruteur`,
    unsubscribeUrl: `${config.publicUrl}/desinscription?application_id=${createToken({ application_id: application._id }, "30d", "desinscription")}${utmRecruiterData}-desinscription`,
    lbaUrl: `${config.publicUrl}?${utmRecruiterData}-home`,
    faqUrl: `${config.publicUrl}/faq?${utmRecruiterData}-faq`,
    jobProvidedUrl: "",
    cancelJobUrl: "",
    jobPartnerLabel,
  }

  if (application.job_id) {
    urls.jobUrl = `${config.publicUrl}${getDirectJobPath(application.job_origin, application.job_id)}${utmRecruiterData}`
    urls.jobProvidedUrl = createProvidedJobLink(userForToken, application.job_id, application.job_origin, utmRecruiterData)
    urls.cancelJobUrl = createCancelJobLink(userForToken, application.job_id, application.job_origin, utmRecruiterData)
  }

  return urls
}

const offreOrCompanyToCompanyFields = (
  LbaJob: IJobOrCompanyV2
): Pick<IApplication, "company_siret" | "company_name" | "company_naf" | "company_phone" | "company_email" | "job_title" | "company_address" | "job_id"> => {
  const { type } = LbaJob
  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    const { job, recruiter } = LbaJob
    const { address, is_delegated, establishment_siret, establishment_enseigne, establishment_raison_sociale, naf_label, phone, email } = recruiter
    const { rome_appellation_label, rome_label, offer_title_custom } = job
    const application = {
      company_siret: establishment_siret,
      company_name: establishment_enseigne || establishment_raison_sociale || UNKNOWN_COMPANY,
      company_naf: naf_label ?? "",
      company_phone: phone,
      company_email: email,
      job_title: offer_title_custom ?? rome_appellation_label ?? rome_label ?? undefined,
      company_address: is_delegated ? null : address,
      job_id: job._id.toString(),
    }
    return application
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES || type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const { job } = LbaJob
    const { workplace_siret, workplace_name, workplace_naf_label, apply_phone, apply_email, offer_title, workplace_address_label, workplace_legal_name } = job
    const application = {
      company_siret: workplace_siret || null,
      company_name: workplace_name || workplace_legal_name || UNKNOWN_COMPANY,
      company_naf: workplace_naf_label || "",
      company_phone: apply_phone,
      company_email: apply_email || "",
      job_title: offer_title ?? undefined,
      company_address: workplace_address_label,
      job_id: job._id.toString(),
    }
    return application
  } else {
    assertUnreachable(type)
  }
}

const cleanApplicantFields = (newApplication: INewApplicationV1) => {
  return {
    applicant_attachment_name: newApplication.applicant_file_name,
    applicant_message_to_company: prepareMessageForMail(newApplication.message),
    caller: newApplication.caller,
  }
}

/**
 * @description Initialize application object from query parameters
 */

const newApplicationToApplicationDocument = async (newApplication: INewApplicationV1, applicant: IApplicant, offreOrCompany: IJobOrCompanyV2, recruteurEmail: string) => {
  const now = new Date()
  const application: IApplication = {
    ...offreOrCompanyToCompanyFields(offreOrCompany),
    ...cleanApplicantFields(newApplication),
    applicant_id: applicant._id,
    company_email: recruteurEmail.toLowerCase(),
    company_recruitment_intention: null,
    company_recruitment_intention_date: null,
    company_feedback_send_status: null,
    company_feedback: null,
    company_feedback_reasons: null,
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
// get data from applicant
const newApplicationToApplicationDocumentV2 = async (
  newApplication: IApplicationApiPublicOutput | IApplicationApiPrivateOutput,
  applicant: IApplicant,
  LbaJob: IJobOrCompanyV2,
  caller?: string
) => {
  const now = new Date()
  const application: IApplication = {
    _id: new ObjectId(),
    applicant_id: applicant._id,
    applicant_attachment_name: newApplication.applicant_attachment_name,
    applicant_message_to_company: prepareMessageForMail(newApplication.applicant_message),
    job_searched_by_user: "job_searched_by_user" in newApplication ? newApplication.job_searched_by_user : null,
    company_recruitment_intention: null,
    company_feedback_send_status: null,
    company_recruitment_intention_date: null,
    company_feedback: null,
    company_feedback_reasons: null,
    caller: caller,
    job_origin: LbaJob.type,
    created_at: now,
    last_update_at: now,
    to_applicant_message_id: null,
    to_company_message_id: null,
    scan_status: ApplicationScanStatus.WAITING_FOR_SCAN,
    application_url: "application_url" in newApplication ? newApplication.application_url : null,
    ...offreOrCompanyToCompanyFields(LbaJob),
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
export const validateJob = async (application: INewApplicationV1): Promise<IJobOrCompanyV2 | { error: string }> => {
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
      return { error: BusinessErrorCodes.EXPIRED }
    }
    return { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job, recruiter }
  } else if (company_type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    if (!company_siret) {
      return { error: "company_siret manquant" }
    }
    const lbaCompany = await getDbCollection("jobs_partners").findOne({ workplace_siret: company_siret })
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
 * TODO KBA 20240502 : TO DELETE WHEN SWITCHING TO V2 and V1 support has ended
 */
export const validatePermanentEmail = (email: string): string => {
  if (isEmailBurner(email)) {
    return "email temporaire non autorisé"
  }
  return "ok"
}

async function getApplicationCountForItemV2(applicantId: ObjectId, LbaJob: IJobOrCompanyV2) {
  const { type, job } = LbaJob

  if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return getDbCollection("applications").countDocuments({
      applicant_id: applicantId,
      company_siret: job.workplace_siret,
    })
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA || type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    return getDbCollection("applications").countDocuments({
      applicant_id: applicantId,
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
const checkUserApplicationCount = async (applicantId: ObjectId, offreOrCompany: IJobOrCompanyV2, caller: string | null | undefined): Promise<string> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const { type, job, recruiter } = offreOrCompany
  let siret: string | null = null

  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    siret = recruiter.establishment_siret
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES || type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    siret = job.workplace_siret
  }

  const [todayApplicationsCount, itemApplicationCount, callerApplicationCount] = await Promise.all([
    getDbCollection("applications").countDocuments({
      applicant_id: applicantId,
      created_at: { $gte: start, $lt: end },
    }),
    getApplicationCountForItemV2(applicantId, offreOrCompany),
    caller && siret
      ? getDbCollection("applications").countDocuments({
          caller: caller.toLowerCase(),
          company_siret: siret,
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
// get data from applicant
const checkUserApplicationCountV2 = async (applicantId: ObjectId, LbaJob: IJobOrCompanyV2, caller?: string): Promise<void> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const { type, job, recruiter } = LbaJob
  let siret: string | null = null

  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    siret = recruiter.establishment_siret
  } else if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA || type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    siret = job.workplace_siret
  }

  const [todayApplicationsCount, itemApplicationCount, callerApplicationCount] = await Promise.all([
    getDbCollection("applications").countDocuments({
      applicant_id: applicantId,
      created_at: { $gte: start, $lt: end },
    }),
    getApplicationCountForItemV2(applicantId, LbaJob),
    caller && siret
      ? getDbCollection("applications").countDocuments({
          caller,
          company_siret: siret,
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

const getJobSourceType = async (application: IApplication) => {
  if (LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA === application.job_origin && application.job_id) {
    const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": new ObjectId(application.job_id) })
    if (recruiter?.cfa_delegated_siret) {
      return CFA
    }
  }

  return ENTREPRISE
}
/**
 * @description sends notification email to applicant
 */
// get data from applicant
export const sendMailToApplicant = async ({
  application,
  applicant,
  email,
  phone,
  company_recruitment_intention,
  company_feedback,
  refusal_reasons,
}: {
  application: IApplication
  applicant: IApplicant
  email: string | null
  phone: string | null
  company_recruitment_intention: ApplicationIntention
  company_feedback: string
  refusal_reasons: RefusalReasons[]
}): Promise<{ messageId: string; accepted?: string[] | undefined } | null> => {
  const partner = (application.caller && PARTNER_NAMES[application.caller]) ?? null
  const jobSourceType: string = await getJobSourceType(application)
  const { email: applicantEmail } = applicant
  let sentMessageId: {
    messageId: string
    accepted?: string[] | undefined
  } | null = null

  switch (company_recruitment_intention) {
    case ApplicationIntention.ENTRETIEN: {
      sentMessageId = await mailer.sendEmail({
        to: applicantEmail,
        cc: email!,
        subject: `Réponse positive de ${application.company_name} à la candidature${partner ? ` ${partner}` : ""} de ${applicant.firstname} ${applicant.lastname}`,
        template: getEmailTemplate("mail-candidat-entretien"),
        data: {
          ...sanitizeApplicationForEmail(application),
          ...sanitizeApplicantForEmail(applicant),
          jobSourceType,
          partner,
          ...images,
          email,
          phone: sanitizeTextField(removeUrlsFromText(phone)),
          comment: prepareMessageForMail(sanitizeTextField(company_feedback)),
        },
      })
      break
    }
    case ApplicationIntention.REFUS: {
      sentMessageId = await mailer.sendEmail({
        to: applicantEmail,
        subject: `Réponse négative de ${application.company_name} à la candidature${partner ? ` ${partner}` : ""} de ${applicant.firstname} ${applicant.lastname}`,
        template: getEmailTemplate("mail-candidat-refus"),
        data: {
          ...sanitizeApplicationForEmail(application),
          ...sanitizeApplicantForEmail(applicant),
          jobSourceType,
          partner,
          ...images,
          comment: prepareMessageForMail(sanitizeTextField(company_feedback)),
          reasons: refusal_reasons,
        },
      })
      break
    }
    default:
      break
  }
  return sentMessageId
}

/**
 * sends email notification to applicant if it's application hardbounced
 */
const notifyHardbounceToApplicant = async ({ application }: { application: IApplication }): Promise<void> => {
  const applicant = await getApplicantFromDB({ _id: application.applicant_id })
  if (applicant) {
    await mailer.sendEmail({
      to: applicant.email,
      subject: `Votre candidature n'a pas pu être envoyée à ${application.company_name}`,
      template: getEmailTemplate("mail-candidat-hardbounce"),
      data: { ...sanitizeApplicationForEmail(application), ...sanitizeApplicantForEmail(applicant!), ...images },
    })
  } else {
    sentryCaptureException(new Error("Applicant not found while processing applicantion hardbounce"), { extra: { applicant_id: application.applicant_id } })
  }
}

export interface IApplicationCount {
  _id: string
  count: number
}

/**
 * @description retourne le nombre de candidatures enregistrées par identifiant d'offres lba fournis
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
export const getApplicationByCompanyCount = async (sirets: string[]): Promise<IApplicationCount[]> => {
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
export const processApplicationHardbounceEvent = async (payload, sendNotificationToApplicant: any = notifyHardbounceToApplicant) => {
  const { email } = payload
  const messageId = payload["message-id"]

  const application = await findApplicationByMessageId({
    messageId,
    email,
  })

  if (application) {
    await sendNotificationToApplicant({ application })
    return true
  }

  return false
}
// get data from applicant
export const processApplicationCandidateHardbounceEvent = async (payload) => {
  const { email } = payload
  const messageId = payload["message-id"]

  const applicant = await getDbCollection("applicants").findOne({ email })

  if (applicant) {
    const application = await getDbCollection("applications").findOne({ applicant_id: applicant?._id, to_applicant_message_id: messageId })
    if (application) {
      return true
    }
  }

  return false
}

export const obfuscateLbaCompanyApplications = async (sirets: string[]) => {
  const fakeEmail = "faux_email@faux-domaine-compagnie.com"
  await getDbCollection("applications").updateMany(
    { job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA, company_siret: { $in: sirets } },
    { $set: { to_company_message_id: fakeEmail, company_email: fakeEmail } }
  )
}
const sanitizeApplicantForEmail = (applicant: IApplicant) => {
  const { firstname, lastname, email, phone } = applicant
  return {
    applicant_email: sanitizeTextField(email),
    applicant_first_name: sanitizeTextField(firstname),
    applicant_last_name: sanitizeTextField(lastname),
    applicant_phone: sanitizeTextField(phone),
  }
}
// get data from applicant
const sanitizeApplicationForEmail = (application: IApplication) => {
  const {
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
    applicant_attachment_name: sanitizeTextField(applicant_attachment_name),
    job_searched_by_user: sanitizeTextField(job_searched_by_user),
    applicant_message_to_company: sanitizeTextField(applicant_message_to_company, true),
    company_recruitment_intention: sanitizeTextField(company_recruitment_intention),
    company_feedback: sanitizeTextField(company_feedback),
    company_feedback_date: company_feedback_date,
    company_siret: company_siret,
    company_email: sanitizeTextField(company_email),
    company_phone: sanitizeTextField(company_phone),
    company_name: company_name,
    company_naf: company_naf,
    company_address: company_address,
    job_origin: job_origin,
    job_title: sanitizeTextField(job_title),
    job_id: job_id,
    caller: sanitizeTextField(caller),
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
// get data from applicant
export const processApplicationScanForVirus = async (application: IApplication, applicant: IApplicant) => {
  const fileContent = await getApplicationAttachmentContent(application)
  const hasVirus = await isInfected(fileContent)
  const { email: applicantEmail } = applicant
  await getDbCollection("applications").findOneAndUpdate(
    { _id: application._id },
    { $set: { scan_status: hasVirus ? ApplicationScanStatus.VIRUS_DETECTED : ApplicationScanStatus.NO_VIRUS_DETECTED } }
  )

  if (hasVirus) {
    const { url: urlOfDetail, urlWithoutUtm: urlOfDetailNoUtm } = buildUrlsOfDetail(application, { utm_campaign: "je-candidate-virus-pj" })
    await mailer.sendEmail({
      to: applicantEmail,
      subject: "Echec d'envoi de votre candidature",
      template: getEmailTemplate("mail-echec-envoi-candidature"),
      data: {
        ...sanitizeApplicationForEmail(application),
        ...sanitizeApplicantForEmail(applicant),
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

const getRecruteurEmailSubject = (application: IApplication, applicant: IApplicant) => {
  const { job_origin } = application
  switch (job_origin) {
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      return `Candidature spontanée en alternance ${application.company_name}`

    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      return `Candidature en alternance - ${application.job_title}  - ${applicant.firstname} ${applicant.lastname}`

    default:
      throw new Error(`Unknown job_origin: ${job_origin}`)
  }
}

export const processApplicationEmails = {
  async sendEmailsIfNeeded(application: IApplication, applicant: IApplicant) {
    const { to_company_message_id, to_applicant_message_id } = application
    const attachmentContent = await getApplicationAttachmentContent(application)
    if (!to_company_message_id) {
      await this.sendRecruteurEmail(application, applicant, attachmentContent)
    }
    if (!to_applicant_message_id) {
      await this.sendCandidatEmail(application, applicant)
    }
  },
  // get data from applicant
  async sendRecruteurEmail(application: IApplication, applicant: IApplicant, attachmentContent: string) {
    const { job_origin } = application
    const { url: urlOfDetail, urlWithoutUtm: urlOfDetailNoUtm } = buildUrlsOfDetail(application, { utm_campaign: "je-candidate-recruteur" })
    const recruiterEmailUrls = await buildRecruiterEmailUrlsAndParameters(application, applicant)

    const emailCompany = await mailer.sendEmail({
      to: application.company_email,
      subject: getRecruteurEmailSubject(application, applicant),
      template: getEmailTemplate(emailCandidatureTemplateMap[job_origin]),
      data: {
        ...sanitizeApplicationForEmail(application),
        ...sanitizeApplicantForEmail(applicant),
        ...images,
        ...recruiterEmailUrls,
        urlOfDetail,
        urlOfDetailNoUtm,
        jobPartnerLabel: recruiterEmailUrls.jobPartnerLabel,
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
      logger.error(`Application email rejected. applicant_email=${applicant.email} company_email=${application.company_email}`)
      throw internal("Email entreprise destinataire rejeté.")
    }
  },

  async sendCandidatEmail(application: IApplication, applicant: IApplicant) {
    const { job_origin } = application
    const { url: urlOfDetail, urlWithoutUtm: urlOfDetailNoUtm } = buildUrlsOfDetail(application)
    const emailCandidat = await mailer.sendEmail({
      to: applicant.email,
      subject: `Votre candidature chez ${application.company_name}`,
      template: getEmailTemplate(emailCandidatTemplateMap[job_origin]),
      data: {
        ...sanitizeApplicationForEmail(application),
        ...sanitizeApplicantForEmail(applicant),
        ...images,
        publicUrl,
        urlOfDetail,
        urlOfDetailNoUtm,
        applicationWebsiteOrigin: getApplicationWebsiteOrigin(application.caller),
        applicationDate: dayjs(application.created_at).format("DD/MM/YYYY"),
        reminderDate: dayjs(application.created_at).add(10, "days").format("DD/MM/YYYY"),
        attachmentName: application.applicant_attachment_name,
        sendOtherApplicationsUrl: buildSendOtherApplicationsUrl(application, job_origin ?? LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA),
      },
    })
    if (emailCandidat?.accepted?.length) {
      await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { to_applicant_message_id: emailCandidat.messageId } })
    } else {
      logger.error(`Application email rejected. applicant_email=${applicant.email} company_email=${application.company_email}`)
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

const getJobOrCompany = async (application: IApplication): Promise<IJobOrCompanyV2> => {
  const { job_id, company_siret, job_origin } = application
  if (!job_id) {
    throw internal("getJobOrCompany-job_id manquant")
  }
  if (job_origin === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const company = await getDbCollection("jobs_partners").findOne({ siret: company_siret! })
    if (!company) {
      throw internal(`inattendu: aucun recruteur lba avec siret=${company_siret}`)
    }
    return { type: LBA_ITEM_TYPE.RECRUTEURS_LBA, job: company, recruiter: null }
  }
  if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": new ObjectId(job_id) })
    if (!recruiter) {
      throw internal(`inattendu: aucun recruiter avec jobs._id=${job_id}`)
    }
    const job = recruiter?.jobs?.find((job) => job._id.toString() === job_id)
    if (!job) {
      throw internal(`inattendu: aucun job recruiter avec id=${job_id}`)
    }
    return { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job, recruiter }
  }
  if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    const job = await getDbCollection("jobs_partners").findOne({ _id: new ObjectId(job_id) })
    if (!job) {
      throw internal(`inattendu: aucun job partenaire avec id=${job_id}`)
    }
    return { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, job, recruiter: null }
  }

  throw internal(`inattendu: job_origin invalide ${job_origin}`)
}

export const getCompanyEmailFromToken = async (token: string) => {
  const { application_id } = getTokenValue(token)

  if (!application_id) {
    throw badRequest("Invalid token")
  }

  const application = await getDbCollection("applications").findOne({ _id: new ObjectId(application_id) })

  if (application) {
    const recruteurLba = await getDbCollection("jobs_partners").findOne({ workplace_siret: application.company_siret!, partner_label: JOBPARTNERS_LABEL.RECRUTEURS_LBA })
    if (recruteurLba?.apply_email) {
      return recruteurLba.apply_email
    }
  }

  throw notFound("Adresse non trouvée")
}

const getUTMCampaign = (type: LBA_ITEM_TYPE) => {
  switch (type) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA:
      return "je-candidate"
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES:
      return "je-candidate-partenaires"
    case LBA_ITEM_TYPE.RECRUTEURS_LBA:
      return "je-candidate-spontanement"
  }
}
const addUtmParamsToSendOtherApplications = (type: LBA_ITEM_TYPE, searchParams: URLSearchParams, utmCampaignSuffix: string) => {
  const utmCampaign = `${getUTMCampaign(type)}-${utmCampaignSuffix}`
  searchParams.delete("utm_source")
  searchParams.delete("utm_medium")
  searchParams.delete("utm_campaign")
  searchParams.append("utm_source", "lba-brevo-transactionnel")
  searchParams.append("utm_medium", "email")
  searchParams.append("utm_campaign", utmCampaign)
}

const buildSendOtherApplicationsUrl = (application: IApplication, type: LBA_ITEM_TYPE) => {
  const { application_url } = application

  if (application_url) {
    const url = new URL(application_url)
    if (url.pathname.startsWith("/emploi/")) {
      url.pathname = "/recherche"
    }
    if (!url.searchParams.get("displayFormations")) {
      url.searchParams.append("displayFormations", "false")
    }
    url.searchParams.append("utm_source", "lba-brevo-transactionnel")
    url.searchParams.append("utm_medium", "email")
    url.searchParams.append("utm_campaign", "accuse-envoi-candidature-lien-recherche")
    return url.toString()
  }

  const searchParams = new URLSearchParams()
  addUtmParamsToSendOtherApplications(type, searchParams, "accuse-envoi-lien-home")
  return `${publicUrl}/?${searchParams.toString()}`
}

const getJobOrCompanyFromApplication = async (application: IApplication) => {
  let recruiter: IJobsPartnersOfferPrivate | IRecruiter | null = null
  let job: IJob | IJobsPartnersOfferPrivate | null | undefined = null
  switch (application.job_origin) {
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA: {
      const jobId = new ObjectId(application.job_id!)
      recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": jobId })
      if (recruiter !== null) {
        job = recruiter.jobs.find((job) => job._id === jobId)
      }
      break
    }
    case LBA_ITEM_TYPE.RECRUTEURS_LBA: {
      job = await getDbCollection("jobs_partners").findOne({ workplace_siret: application.company_siret! })
      break
    }
    case LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES: {
      const jobId = new ObjectId(application.job_id!)
      job = await getDbCollection("jobs_partners").findOne({ _id: jobId })
      break
    }
    default:
      throw internal("type de candidature anormal")
  }

  return {
    type: application.job_origin,
    job,
    recruiter,
  } as IJobOrCompanyV2
}

const getPhoneForApplication = async (application: IApplication) => {
  const jobOrCompany = await getJobOrCompanyFromApplication(application)
  const phone = jobOrCompany.type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES ? jobOrCompany.job?.apply_phone : jobOrCompany.recruiter?.phone
  return phone
}

export const getApplicationDataForIntentionAndScheduleMessage = async (applicationId: string, intention: ApplicationIntention) => {
  const application = await getDbCollection("applications").findOne({ _id: new ObjectId(applicationId) })
  if (!application) throw notFound("Candidature non trouvée")
  const applicant = await getDbCollection("applicants").findOne({ _id: application.applicant_id })
  if (!applicant) throw notFound("Candidat non trouvé")

  const jobOrCompany = await getJobOrCompanyFromApplication(application)
  const { recruiter, job, type } = jobOrCompany ?? {}
  let recruiter_phone = ""
  let company_name = ""

  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    if (!recruiter) throw internal(`Société pour ${application.job_origin} introuvable`)

    const { managed_by, establishment_enseigne, establishment_raison_sociale } = recruiter
    company_name = establishment_enseigne || establishment_raison_sociale || ""
    await validateUserWithAccountEmail(new ObjectId(managed_by))
    recruiter_phone = recruiter.phone || ""
  }

  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES || type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const { apply_phone, workplace_brand, workplace_name, workplace_legal_name } = job
    recruiter_phone = apply_phone || ""
    company_name = workplace_brand || workplace_name || workplace_legal_name || ""
  }

  await getDbCollection("applications").updateOne(
    {
      _id: application._id,
    },
    {
      $set: {
        company_feedback_send_status: CompanyFeebackSendStatus.SCHEDULED,
        company_recruitment_intention_date: new Date(),
        company_recruitment_intention: intention,
      },
    }
  )

  return {
    recruiter_email: application.company_email,
    recruiter_phone,
    applicant_first_name: applicant.firstname,
    applicant_last_name: applicant.lastname,
    company_name,
  }
}

export const processRecruiterIntention = async ({ application }: { application: IApplication }) => {
  const applicant = await getApplicantFromDB({ _id: application.applicant_id })

  if (!applicant) {
    throw notFound(`unexpected: applicant not found for application ${application._id}`)
  }
  const company_recruitment_intention = parseEnum(ApplicationIntention, application.company_recruitment_intention) ?? ApplicationIntention.ENTRETIEN
  const company_feedback = ApplicationIntentionDefaultText[company_recruitment_intention]

  const sentMessageId = await sendMailToApplicant({
    application,
    applicant,
    email: application.company_email,
    phone: (await getPhoneForApplication(application)) ?? "",
    company_recruitment_intention,
    company_feedback,
    refusal_reasons: [],
  })

  if (sentMessageId?.accepted?.length) {
    await getDbCollection("applications").updateOne(
      { _id: application._id },
      { $set: { company_feedback_send_status: CompanyFeebackSendStatus.SENT, company_feedback, company_feedback_date: new Date() } }
    )

    await getDbCollection("applicants_email_logs").insertOne({
      _id: new ObjectId(),
      applicant_id: applicant._id,
      type: application.company_recruitment_intention === ApplicationIntention.ENTRETIEN ? EMAIL_LOG_TYPE.INTENTION_ENTRETIEN : EMAIL_LOG_TYPE.INTENTION_REFUS,
      message_id: sentMessageId?.messageId ?? null,
      application_id: application._id,
      createdAt: new Date(),
    })
  } else {
    throw internal(`unexpected: intention scheduled message not sent for application ${application._id}`)
  }
}

export const sendRecruiterIntention = async ({
  application_id,
  company_recruitment_intention,
  company_feedback,
  email,
  phone,
  refusal_reasons,
}: {
  application_id: ObjectId
  company_recruitment_intention: ApplicationIntention
  company_feedback: string
  email: string
  phone: string
  refusal_reasons: RefusalReasons[]
}) => {
  const application = await getDbCollection("applications").findOne({ _id: application_id })

  if (!application) {
    throw notFound(`unexpected: application not found when processing intentions. application_id=${application_id}`)
  }

  const applicant = await getApplicantFromDB({ _id: application.applicant_id })

  if (!applicant) {
    throw notFound(`unexpected: applicant not found for application ${application_id}`)
  }

  const sentMessageId = await sendMailToApplicant({
    application,
    applicant,
    email,
    phone,
    company_recruitment_intention,
    company_feedback,
    refusal_reasons,
  })

  if (sentMessageId?.accepted?.length) {
    await getDbCollection("applications").findOneAndUpdate(
      { _id: application_id },
      {
        $set: {
          company_recruitment_intention,
          company_feedback,
          company_feedback_send_status: CompanyFeebackSendStatus.SENT,
          company_feedback_reasons: refusal_reasons,
          company_feedback_date: new Date(),
        },
      }
    )

    await getDbCollection("applicants_email_logs").insertOne({
      _id: new ObjectId(),
      applicant_id: applicant._id,
      type: company_recruitment_intention === ApplicationIntention.ENTRETIEN ? EMAIL_LOG_TYPE.INTENTION_ENTRETIEN : EMAIL_LOG_TYPE.INTENTION_REFUS,
      message_id: sentMessageId?.messageId ?? null,
      application_id: application._id,
      createdAt: new Date(),
    })
  } else {
    throw internal(`unexpected: intention message not sent for application ${application_id}`)
  }
}

export const processScheduledRecruiterIntentions = async () => {
  try {
    const stream = await getDbCollection("applications")
      .find({
        company_recruitment_intention_date: { $lte: dayjs().subtract(3, "hours").toDate() },
        company_feedback_send_status: CompanyFeebackSendStatus.SCHEDULED,
      })
      .stream()

    const counters = { total: 0, entretien: 0, error: 0 }

    const transform = new Transform({
      objectMode: true,
      async transform(application: IApplication, encoding, callback: (error?: Error | null, data?: any) => void) {
        counters.total++
        try {
          await processRecruiterIntention({ application })

          if (application.company_recruitment_intention === ApplicationIntention.ENTRETIEN) {
            counters.entretien++
          }
        } catch (intentionErr) {
          counters.error++
          await getDbCollection("applications").updateOne(
            { _id: application._id },
            { $set: { company_feedback_send_status: CompanyFeebackSendStatus.ERROR, company_feedback_date: new Date() } }
          )
          sentryCaptureException(intentionErr)
        }
        callback(null)
      },
    })

    await pipeline(stream, transform)

    await notifyToSlack({
      subject: "Envoi des intentions des recruteurs",
      message: `${counters.total} intentions traitrées. ${counters.total - counters.error} intentions envoyées. ${counters.entretien} proposition(s) d'entretien. ${counters.error} erreurs.`,
      error: false,
    })
  } catch (err) {
    await notifyToSlack({
      subject: "Envoi des intentions des recruteurs",
      message: "Erreur technique dans le traitement des intentions des recruteurs",
      error: true,
    })
    throw err
  }
}

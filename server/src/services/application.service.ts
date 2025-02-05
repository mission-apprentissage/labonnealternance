import { Transform } from "stream"
import { pipeline } from "stream/promises"

import { badRequest, internal, notFound, tooManyRequests } from "@hapi/boom"
import { isEmailBurner } from "burner-email-providers"
import dayjs from "dayjs"
import { fileTypeFromBuffer } from "file-type"
import { ObjectId } from "mongodb"
import {
  ApplicationScanStatus,
  EMAIL_LOG_TYPE,
  IApplicant,
  IApplication,
  IApplicationApiPrivateOutput,
  IApplicationApiPublicOutput,
  IJob,
  ILbaCompany,
  INewApplicationV1,
  IRecruiter,
  JOB_STATUS,
  JobCollectionName,
  assertUnreachable,
} from "shared"
import { ApplicationIntention, ApplicationIntentionDefaultText, RefusalReasons } from "shared/constants/application"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE, newItemTypeToOldItemType } from "shared/constants/lbaitem"
import { CFA, ENTREPRISE, RECRUITER_STATUS } from "shared/constants/recruteur"
import { prepareMessageForMail, removeUrlsFromText } from "shared/helpers/common"
import { getDirectJobPath } from "shared/metier/lbaitemutils"
import { IJobsPartnersOfferPrivate } from "shared/models/jobsPartners.model"
import { IRecruiterIntentionMail } from "shared/models/recruiterIntentionMail.model"
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
import { removeHtmlTagsFromString } from "../common/utils/stringUtils"
import config from "../config"

import { getApplicantFromDB, getOrCreateApplicant } from "./applicant.service"
import { createCancelJobLink, createProvidedJobLink, generateApplicationReplyToken } from "./appLinks.service"
import { BrevoEventStatus } from "./brevo.service"
import { isInfected } from "./clamav.service"
import { getOffreAvecInfoMandataire } from "./formulaire.service"
import mailer from "./mailer.service"
import { validateCaller } from "./queryValidator.service"
import { buildLbaCompanyAddress } from "./recruteurLba.service"
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

type IJobOrCompany =
  | { type: LBA_ITEM_TYPE.RECRUTEURS_LBA; job: ILbaCompany; recruiter: null }
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
export const isEmailBlacklisted = async (email: string): Promise<boolean> => Boolean(await getDbCollection("emailblacklists").countDocuments({ email }))

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
  return await getDbCollection("recruteurslba").updateMany({ email }, { $set: { email: "" } })
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
      const recruteurEmail = (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? recruiter.email : type === LBA_ITEM_TYPE.RECRUTEURS_LBA ? job.email : job.apply_email)?.toLowerCase()
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

async function validateApplicationFileType(base64String: string) {
  // Remove the data URL part if it's present
  const base64Data = base64String.replace(/^data:[^;]+;base64,/, "")
  // Convert base64 string to a buffer
  const buffer = Buffer.from(base64Data, "base64")
  // Get the file type from the buffer
  const type = await fileTypeFromBuffer(buffer)

  if (!type) {
    sentryCaptureException("Application file type could not be determined", { extra: { responseData: base64Data } })
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
  let lbaJob: IJobOrCompany = { type: null as any, job: null as any, recruiter: null }
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

  if (collectionName === JobCollectionName.recruteurslba) {
    const job = await getDbCollection("recruteurslba").findOne({ _id: new ObjectId(jobId) })
    if (!job) {
      throw badRequest(BusinessErrorCodes.NOTFOUND)
    }
    lbaJob = { type: LBA_ITEM_TYPE.RECRUTEURS_LBA, job, recruiter: null }
  }
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
    lbaJob = { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES, job, recruiter: null }
  }

  await checkUserApplicationCountV2(applicant._id, lbaJob, caller)

  const { type, job, recruiter } = lbaJob
  const recruteurEmail = (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? recruiter.email : type === LBA_ITEM_TYPE.RECRUTEURS_LBA ? job.email : job.apply_email)?.toLowerCase()
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
  const { job_id, company_siret, job_origin } = application
  const defaultUtm = { utm_source: "lba", utm_medium: "email", utm_campaign: "je-candidate" }
  const { utm_campaign, utm_medium, utm_source } = { ...defaultUtm, ...utm }
  const urlSearchParams = new URLSearchParams()
  urlSearchParams.append("display", "list")
  urlSearchParams.append("page", "fiche")
  urlSearchParams.append("type", newItemTypeToOldItemType(job_origin))
  urlSearchParams.append("itemId", job_id! || company_siret!)
  const paramsWithoutUtm = urlSearchParams.toString()
  urlSearchParams.append("utm_source", utm_source)
  urlSearchParams.append("utm_medium", utm_medium)
  if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    urlSearchParams.append("utm_campaign", utm_campaign)
  }
  if (job_origin === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    urlSearchParams.append("utm_campaign", `${utm_campaign}-spontanement`)
  }
  if (job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    urlSearchParams.append("utm_campaign", `${utm_campaign}-partenaire`)
  }
  const params = urlSearchParams.toString()
  return {
    urlWithoutUtm: `${publicUrl}/recherche?${paramsWithoutUtm}`,
    url: `${publicUrl}/recherche?${params}`,
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
 * email recruteur uniquement
 */
const buildRecruiterEmailUrls = async (application: IApplication, applicant: IApplicant) => {
  const utmRecruiterData = "&utm_source=lba&utm_medium=email&utm_campaign=je-candidate-recruteur"

  let user: IUserWithAccount | undefined
  if (application.job_origin === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    const jobOrCompany = await getJobOrCompany(application)
    if (jobOrCompany.type !== LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
      throw internal(`inattendu : type !== ${LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA}`)
    }
    user = await getUser2ManagingOffer(jobOrCompany.job)
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

const offreOrCompanyToCompanyFields = (
  LbaJob: IJobOrCompany
): Pick<IApplication, "company_siret" | "company_name" | "company_naf" | "company_phone" | "company_email" | "job_title" | "company_address" | "job_id"> => {
  const { type } = LbaJob
  if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const { job } = LbaJob
    const { siret, enseigne, naf_label, phone, email, _id } = job
    const application = {
      company_siret: siret,
      company_name: enseigne,
      company_naf: naf_label,
      company_phone: phone,
      company_email: email!,
      job_title: enseigne,
      company_address: buildLbaCompanyAddress(job),
      job_id: _id.toString(),
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
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    const { job } = LbaJob
    const { workplace_siret, workplace_name, workplace_naf_label, apply_phone, apply_email, offer_title, workplace_address_label } = job
    const application = {
      company_siret: workplace_siret || null,
      company_name: workplace_name || "Enseigne inconnue",
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

const newApplicationToApplicationDocument = async (newApplication: INewApplicationV1, applicant: IApplicant, offreOrCompany: IJobOrCompany, recruteurEmail: string) => {
  const now = new Date()
  const application: IApplication = {
    ...offreOrCompanyToCompanyFields(offreOrCompany),
    ...cleanApplicantFields(newApplication),
    applicant_id: applicant._id,
    company_email: recruteurEmail.toLowerCase(),
    company_recruitment_intention: null,
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
  LbaJob: IJobOrCompany,
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
      return { error: BusinessErrorCodes.EXPIRED }
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

// get data from applicant
async function getApplicationCountForItem(applicantId: ObjectId, LbaJob: IJobOrCompany) {
  const { type, job } = LbaJob

  if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    return getDbCollection("applications").countDocuments({
      applicant_id: applicantId,
      company_siret: job.siret,
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
const checkUserApplicationCount = async (applicantId: ObjectId, offreOrCompany: IJobOrCompany, caller: string | null | undefined): Promise<string> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const { type, job, recruiter } = offreOrCompany
  let siret: string | null = null

  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    siret = recruiter.establishment_siret
  } else if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    siret = job.siret
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    siret = job.workplace_siret
  }

  const [todayApplicationsCount, itemApplicationCount, callerApplicationCount] = await Promise.all([
    getDbCollection("applications").countDocuments({
      applicant_id: applicantId,
      created_at: { $gte: start, $lt: end },
    }),
    getApplicationCountForItem(applicantId, offreOrCompany),
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
const checkUserApplicationCountV2 = async (applicantId: ObjectId, LbaJob: IJobOrCompany, caller?: string): Promise<void> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const { type, job, recruiter } = LbaJob
  let siret: string | null = null

  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    siret = recruiter.establishment_siret
  } else if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    siret = job.siret
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    siret = job.workplace_siret
  }

  const [todayApplicationsCount, itemApplicationCount, callerApplicationCount] = await Promise.all([
    getDbCollection("applications").countDocuments({
      applicant_id: applicantId,
      created_at: { $gte: start, $lt: end },
    }),
    getApplicationCountForItem(applicantId, LbaJob),
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
}): Promise<void> => {
  const partner = (application.caller && PARTNER_NAMES[application.caller]) ?? null
  const jobSourceType: string = await getJobSourceType(application)
  const { email: applicantEmail } = applicant

  switch (company_recruitment_intention) {
    case ApplicationIntention.ENTRETIEN: {
      mailer.sendEmail({
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
          phone: removeHtmlTagsFromString(removeUrlsFromText(phone)),
          comment: prepareMessageForMail(removeHtmlTagsFromString(company_feedback)),
        },
      })
      break
    }
    case ApplicationIntention.NESAISPAS: {
      mailer.sendEmail({
        to: applicantEmail,
        cc: email!,
        subject: `Réponse de ${application.company_name} à la candidature de ${applicant.firstname} ${applicant.lastname}`,
        template: getEmailTemplate("mail-candidat-nsp"),
        data: {
          ...sanitizeApplicationForEmail(application),
          ...sanitizeApplicantForEmail(applicant),
          partner,
          ...images,
          email,
          phone: removeHtmlTagsFromString(removeUrlsFromText(phone)),
          comment: prepareMessageForMail(removeHtmlTagsFromString(company_feedback)),
        },
      })
      break
    }
    case ApplicationIntention.REFUS: {
      mailer.sendEmail({
        to: applicantEmail,
        subject: `Réponse négative de ${application.company_name} à la candidature${partner ? ` ${partner}` : ""} de ${applicant.firstname} ${applicant.lastname}`,
        template: getEmailTemplate("mail-candidat-refus"),
        data: {
          ...sanitizeApplicationForEmail(application),
          ...sanitizeApplicantForEmail(applicant),
          jobSourceType,
          partner,
          ...images,
          comment: prepareMessageForMail(removeHtmlTagsFromString(company_feedback)),
          reasons: refusal_reasons,
        },
      })
      break
    }
    default:
      break
  }
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

export const obfuscateLbaCompanyApplications = async (company_siret: string) => {
  const fakeEmail = "faux_email@faux-domaine-compagnie.com"
  await getDbCollection("applications").updateMany(
    { job_origin: LBA_ITEM_TYPE.RECRUTEURS_LBA, company_siret },
    { $set: { to_company_message_id: fakeEmail, company_email: fakeEmail } }
  )
}
const sanitizeApplicantForEmail = (applicant: IApplicant) => {
  const { firstname, lastname, email, phone } = applicant
  return {
    applicant_email: removeHtmlTagsFromString(email),
    applicant_first_name: removeHtmlTagsFromString(firstname),
    applicant_last_name: removeHtmlTagsFromString(lastname),
    applicant_phone: removeHtmlTagsFromString(phone),
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
    applicant_attachment_name: removeHtmlTagsFromString(applicant_attachment_name),
    job_searched_by_user: removeHtmlTagsFromString(job_searched_by_user),
    applicant_message_to_company: removeHtmlTagsFromString(applicant_message_to_company, true),
    company_recruitment_intention: removeHtmlTagsFromString(company_recruitment_intention),
    company_feedback: removeHtmlTagsFromString(company_feedback),
    company_feedback_date: company_feedback_date,
    company_siret: company_siret,
    company_email: removeHtmlTagsFromString(company_email),
    company_phone: removeHtmlTagsFromString(company_phone),
    company_name: company_name,
    company_naf: company_naf,
    company_address: company_address,
    job_origin: job_origin,
    job_title: removeHtmlTagsFromString(job_title),
    job_id: job_id,
    caller: removeHtmlTagsFromString(caller),
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
    const recruiterEmailUrls = await buildRecruiterEmailUrls(application, applicant)

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
  // get data from applicant
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

const getJobOrCompany = async (application: IApplication): Promise<IJobOrCompany> => {
  const { job_id, company_siret, job_origin } = application
  if (!job_id) {
    throw internal("getJobOrCompany-job_id manquant")
  }
  if (job_origin === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const company = await getDbCollection("recruteurslba").findOne({ siret: company_siret! })
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
    const recruteurLba = await getDbCollection("recruteurslba").findOne({ siret: application.company_siret! })
    if (recruteurLba?.email) {
      return recruteurLba.email
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
    const newParams = url.searchParams
    if (newParams.get("job_name")) {
      newParams.delete("page")
      newParams.delete("type")
      newParams.delete("itemId")
      addUtmParamsToSendOtherApplications(type, newParams, "accuse-envoi-lien-recherche")
      return `${publicUrl}${url.pathname}?${newParams.toString()}`
    }
  }
  const searchParams = new URLSearchParams()
  addUtmParamsToSendOtherApplications(type, searchParams, "accuse-envoi-lien-home")
  return `${publicUrl}/?${searchParams.toString()}`
}

const getJobOrCompanyFromApplication = async (application: IApplication) => {
  let recruiter: ILbaCompany | IRecruiter | null = null
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
      recruiter = await getDbCollection("recruteurslba").findOne({ siret: application.company_siret! })
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
  } as IJobOrCompany
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

  if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA || type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    if (!recruiter) throw internal(`Société pour ${application.job_origin} introuvable`)

    const { managed_by } = recruiter
    if (managed_by) {
      await validateUserWithAccountEmail(new ObjectId(managed_by))
    }
    recruiter_phone = recruiter.phone || ""
  }

  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_PARTENAIRES) {
    recruiter_phone = job.apply_phone || ""
  }

  await getDbCollection("recruiter_intention_mails").updateOne(
    {
      applicationId: application._id,
    },
    {
      $setOnInsert: { _id: new ObjectId(), applicationId: application._id },
      $set: {
        createdAt: new Date(),
        intention,
      },
    },
    { upsert: true }
  )

  return {
    recruiter_email: application.company_email,
    recruiter_phone,
    applicant_first_name: applicant.firstname,
    applicant_last_name: applicant.lastname,
  }
}

export const sendRecruiterIntention = async ({
  application_id,
  company_recruitment_intention,
  company_feedback,
  email,
  phone,
  refusal_reasons,
  shouldComputePhoneAndEmail = false,
}: {
  application_id: ObjectId
  company_recruitment_intention: ApplicationIntention
  company_feedback: string
  email: string | null
  phone: string | null
  refusal_reasons: RefusalReasons[]
  shouldComputePhoneAndEmail?: boolean
}) => {
  const application = await getDbCollection("applications").findOneAndUpdate(
    { _id: application_id },
    { $set: { company_recruitment_intention, company_feedback, company_feedback_reasons: refusal_reasons, company_feedback_date: new Date() } }
  )

  if (!application) {
    throw notFound(`unexpected: application not found when processing intentions. application_id=${application_id}`)
  }

  const applicant = await getApplicantFromDB({ _id: application.applicant_id })

  if (!applicant) {
    throw notFound(`unexpected: applicant not found for application ${application_id}`)
  }

  const computedPhone = shouldComputePhoneAndEmail ? ((await getPhoneForApplication(application)) ?? "") : phone
  const computedEmail = shouldComputePhoneAndEmail ? application.company_email : email

  await sendMailToApplicant({
    application,
    applicant,
    email: computedEmail,
    phone: computedPhone,
    company_recruitment_intention,
    company_feedback,
    refusal_reasons,
  })

  await getDbCollection("recruiter_intention_mails").deleteOne({ applicationId: application_id })

  await getDbCollection("applicants_email_logs").insertOne({
    _id: new ObjectId(),
    applicant_id: applicant._id,
    type: company_recruitment_intention === ApplicationIntention.ENTRETIEN ? EMAIL_LOG_TYPE.INTENTION_ENTRETIEN : EMAIL_LOG_TYPE.INTENTION_REFUS,
    message_id: null,
    createdAt: new Date(),
  })
}

export const processScheduledRecruiterIntentions = async () => {
  try {
    const stream = await getDbCollection("recruiter_intention_mails")
      .find({ createdAt: { $lte: dayjs().subtract(3, "hours").toDate() } })
      .stream()

    const counters = { total: 0, entretien: 0, error: 0 }

    const transform = new Transform({
      objectMode: true,
      async transform(recruiterIntention: IRecruiterIntentionMail, encoding, callback: (error?: Error | null, data?: any) => void) {
        counters.total++
        try {
          await sendRecruiterIntention({
            application_id: recruiterIntention.applicationId,
            company_recruitment_intention: recruiterIntention.intention,
            company_feedback: recruiterIntention.intention === ApplicationIntention.REFUS ? ApplicationIntentionDefaultText.REFUS : ApplicationIntentionDefaultText.ENTRETIEN,
            email: null,
            phone: null,
            refusal_reasons: [],
            shouldComputePhoneAndEmail: true,
          })

          if (recruiterIntention.intention === ApplicationIntention.ENTRETIEN) {
            counters.entretien++
          }
        } catch (intentionErr) {
          counters.error++
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

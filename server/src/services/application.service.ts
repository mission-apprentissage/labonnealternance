import Boom from "boom"
import { isEmailBurner } from "burner-email-providers"
import Joi from "joi"
import { ObjectId } from "mongodb"
import { IApplication, IJob, ILbaCompany, INewApplicationV2, IRecruiter, JOB_STATUS, assertUnreachable } from "shared"
import { ApplicantIntention } from "shared/constants/application"
import { BusinessErrorCodes } from "shared/constants/errorCodes"
import { LBA_ITEM_TYPE, LBA_ITEM_TYPE_OLD, newItemTypeToOldItemType } from "shared/constants/lbaitem"
import { RECRUITER_STATUS } from "shared/constants/recruteur"
import { prepareMessageForMail, removeUrlsFromText } from "shared/helpers/common"
import { IUserWithAccount } from "shared/models/userWithAccount.model"
import { INewApplicationV2NEWCompanySiret, INewApplicationV2NEWJobId } from "shared/routes/application.routes.v2"
import { z } from "zod"

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
import { getJobFromRecruiter, getOffreAvecInfoMandataire } from "./formulaire.service"
import { buildLbaCompanyAddress } from "./lbacompany.service"
import mailer, { sanitizeForEmail } from "./mailer.service"
import { validateCaller } from "./queryValidator.service"

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
  },
}

type ILbaJob = { type: LBA_ITEM_TYPE.RECRUTEURS_LBA; job: ILbaCompany; recruiter: null } | { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA; job: IJob; recruiter: IRecruiter }

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
          $setOnInsert: { _id: new ObjectId(), created_at: new Date() },
        },
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
  return await getDbCollection("bonnesboites").updateMany({ email }, { $set: { email: "" } })
}

/**
 * Send an application email to a company and a confirmation email to the applicant
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2
 */
export const sendApplication = async ({
  newApplication,
  referer,
}: {
  newApplication: INewApplicationV2
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
      const fileContent = newApplication.applicant_file_content

      const { url: urlOfDetail, urlWithoutUtm: urlOfDetailNoUtm } = buildUrlsOfDetail(publicUrl, offreOrError)
      const recruiterEmailUrls = await buildRecruiterEmailUrls(application)
      const searched_for_job_label = newApplication.searched_for_job_label || ""

      const buildTopic = (company_type: INewApplicationV2["company_type"], aJobTitle?: string | null) => {
        if (company_type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
          return `Candidature en alternance - ${aJobTitle}`
        } else {
          return `Candidature spontanée en alternance ${searched_for_job_label ? "- " + searched_for_job_label : ""}`
        }
      }

      // Sends acknowledge email to "candidate" and application email to "company"
      const emailCompany = await mailer.sendEmail({
        to: newApplication.company_email && newApplication.secret && newApplication.secret === config.lbaSecret ? newApplication.company_email : application.company_email,
        subject: buildTopic(newApplication.company_type, application.job_title),
        template: getEmailTemplate("mail-candidature"),
        data: {
          ...sanitizeApplicationForEmail(application),
          ...images,
          ...recruiterEmailUrls,
          searched_for_job_label: sanitizeForEmail(searched_for_job_label),
          urlOfDetail,
          urlOfDetailNoUtm,
        },
        attachments: [
          {
            filename: application.applicant_attachment_name,
            path: fileContent,
          },
        ],
      })
      const emailCandidat = await mailer.sendEmail({
        to: application.applicant_email,
        subject: `Votre candidature chez ${application.company_name}`,
        template: getEmailTemplate(type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? "mail-candidat-matcha" : "mail-candidat"),
        data: { ...sanitizeApplicationForEmail(application), ...images, publicUrl, urlOfDetail, urlOfDetailNoUtm },
        attachments: [
          {
            filename: application.applicant_attachment_name,
            path: fileContent,
          },
        ],
      })

      await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { to_applicant_message_id: emailCandidat.messageId } })
      if (emailCompany?.accepted?.length) {
        await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { to_company_message_id: emailCompany.messageId } })
      } else {
        logger.info(`Application email rejected. applicant_email=${application.applicant_email} company_email=${application.company_email}`)
        throw new Error("Application email rejected")
      }

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
 * Send an application email to a company and a confirmation email to the applicant
 */
export const sendApplicationV2 = async ({
  newApplication,
  caller,
}: {
  newApplication: INewApplicationV2NEWCompanySiret | INewApplicationV2NEWJobId
  caller?: string
}): Promise<void> => {
  let lbaJob: ILbaJob = { type: null as any, job: null as any, recruiter: null }

  if (isEmailBurner(newApplication.applicant_email)) {
    throw Boom.badRequest(BusinessErrorCodes.BURNER)
  }

  if ("company_siret" in newApplication) {
    // email can be null in collection
    const LbaRecruteur = await getDbCollection("bonnesboites").findOne({ siret: newApplication.company_siret, email: { $not: { $eq: null } } })
    if (!LbaRecruteur) {
      throw Boom.badRequest(BusinessErrorCodes.NOTFOUND)
    }
    lbaJob = { type: LBA_ITEM_TYPE.RECRUTEURS_LBA, job: LbaRecruteur, recruiter: null }
  }

  if ("job_id" in newApplication) {
    const recruiter = await getOffreAvecInfoMandataire(newApplication.job_id)
    if (!recruiter) {
      throw Boom.badRequest(BusinessErrorCodes.NOTFOUND)
    }
    lbaJob = { type: LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA, job: recruiter?.job, recruiter: recruiter?.recruiter }
  }

  await checkUserApplicationCountV2(newApplication.applicant_email.toLowerCase(), lbaJob, caller)

  if (await isInfected(newApplication.applicant_file_content)) {
    throw Boom.badRequest(BusinessErrorCodes.ATTACHMENT)
  }

  const { type, job, recruiter } = lbaJob

  const recruteurEmail = (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? recruiter.email : job.email)?.toLowerCase()
  if (!recruteurEmail) {
    sentryCaptureException(`${BusinessErrorCodes.INTERNAL_EMAIL} ${type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? `recruiter: ${recruiter._id} ` : `LbaCompany: ${job._id}`}`)
    throw Boom.internal(BusinessErrorCodes.INTERNAL_EMAIL)
  }
  try {
    const application = await newApplicationToApplicationDocumentV2(newApplication, lbaJob, recruteurEmail, caller)
    const { url: urlOfDetail, urlWithoutUtm: urlOfDetailNoUtm } = buildUrlsOfDetail(publicUrl, lbaJob)
    const recruiterEmailUrls = await buildRecruiterEmailUrls(application)

    const [emailCompany, emailCandidat] = await Promise.all([
      mailer.sendEmail({
        to: application.company_email,
        subject: type === LBA_ITEM_TYPE.RECRUTEURS_LBA ? `Candidature spontanée en alternance ${application.company_name}` : `Candidature en alternance - ${application.job_title}`,
        template: getEmailTemplate("mail-candidature"),
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
            path: newApplication.applicant_file_content,
          },
        ],
      }),
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Votre candidature chez ${application.company_name}`,
        template: getEmailTemplate(type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA ? "mail-candidat-matcha" : "mail-candidat"),
        data: { ...sanitizeApplicationForEmail(application), ...images, publicUrl, urlOfDetail, urlOfDetailNoUtm },
        attachments: [
          {
            filename: application.applicant_attachment_name,
            path: newApplication.applicant_file_content,
          },
        ],
      }),
    ])

    await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { to_applicant_message_id: emailCandidat.messageId } })
    if (emailCompany?.accepted?.length) {
      await getDbCollection("applications").findOneAndUpdate({ _id: application._id }, { $set: { to_company_message_id: emailCompany.messageId } })
    } else {
      logger.info(`Application email rejected. applicant_email=${application.applicant_email} company_email=${application.company_email}`)
      throw Boom.internal("Email entreprise destinataire rejeté.")
    }
  } catch (err) {
    sentryCaptureException(err)
    if (caller) {
      manageApiError({
        error: err,
        api_path: "applicationV1",
        caller: caller,
        errorTitle: "error_sending_application",
      })
    }
    throw Boom.badRequest(BusinessErrorCodes.UNKNOWN)
  }
}

/**
 * Build url to access item detail on LBA ui
 */
const buildUrlsOfDetail = (publicUrl: string, offreOrCompany: ILbaJob) => {
  const { type } = offreOrCompany
  const urlSearchParams = new URLSearchParams()
  urlSearchParams.append("display", "list")
  urlSearchParams.append("page", "fiche")
  urlSearchParams.append("type", newItemTypeToOldItemType(type))
  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    urlSearchParams.append("itemId", offreOrCompany.job._id.toString())
  } else if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    urlSearchParams.append("itemId", offreOrCompany.job.siret)
  }
  const paramsWithoutUtm = urlSearchParams.toString()
  if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    urlSearchParams.append("utm_source", "jecandidate")
    urlSearchParams.append("utm_medium", "email")
    urlSearchParams.append("utm_campaign", "jecandidaterecruteur")
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
      throw Boom.internal("un user recruteur était attendu")
    }
    return userWithAccountToUserForToken(user)
  } else {
    throw Boom.internal(`job_origin=${job_origin} non supporté`)
  }
}

const buildReplyLink = (application: IApplication, intention: ApplicantIntention, userForToken: UserForAccessToken) => {
  const applicationId = application._id.toString()
  const searchParams = new URLSearchParams()
  searchParams.append("company_recruitment_intention", intention)
  searchParams.append("id", applicationId)
  searchParams.append("fn", application.applicant_first_name)
  searchParams.append("ln", application.applicant_last_name)
  searchParams.append("utm_source", "jecandidate")
  searchParams.append("utm_medium", "email")
  searchParams.append("utm_campaign", "jecandidaterecruteur")
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
  const utmRecruiterData = "&utm_source=jecandidate&utm_medium=email&utm_campaign=jecandidaterecruteur"

  // get the related recruiters to fetch it's establishment_id
  let user: IUserWithAccount | undefined
  if (application.job_id) {
    const recruiter = await getDbCollection("recruiters").findOne({ "jobs._id": new ObjectId(application.job_id) })
    if (recruiter) {
      user = await getUser2ManagingOffer(getJobFromRecruiter(recruiter, application.job_id))
    }
  }

  const userForToken = buildUserForToken(application, user)
  const urls = {
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

  return urls
}

const offreOrCompanyToCompanyFields = (LbaJob: ILbaJob) => {
  const { type } = LbaJob
  if (type === LBA_ITEM_TYPE.RECRUTEURS_LBA) {
    const { job } = LbaJob
    const { siret, enseigne, naf_label } = job
    const application = {
      company_siret: siret,
      company_name: enseigne,
      company_naf: naf_label,
      job_title: enseigne,
      company_address: buildLbaCompanyAddress(job),
    }
    return application
  } else if (type === LBA_ITEM_TYPE.OFFRES_EMPLOI_LBA) {
    const { job, recruiter } = LbaJob
    const { address, is_delegated, establishment_siret, establishment_enseigne, establishment_raison_sociale, naf_label } = recruiter
    const { rome_appellation_label, rome_label } = job
    const application = {
      company_siret: establishment_siret,
      company_name: establishment_enseigne || establishment_raison_sociale || "Enseigne inconnue",
      company_naf: naf_label ?? "",
      job_title: rome_appellation_label ?? rome_label ?? undefined,
      company_address: is_delegated ? null : address,
      job_id: job._id.toString(),
    }
    return application
  } else {
    assertUnreachable(type)
  }
}

const cleanApplicantFields = (newApplication: INewApplicationV2) => {
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
const newApplicationToApplicationDocument = async (newApplication: INewApplicationV2, offreOrCompany: ILbaJob, recruteurEmail: string) => {
  const now = new Date()
  const application: IApplication = {
    ...offreOrCompanyToCompanyFields(offreOrCompany),
    ...cleanApplicantFields(newApplication),
    company_email: recruteurEmail.toLowerCase(),
    job_origin: newApplication.company_type,
    _id: new ObjectId(),
    created_at: now,
    last_update_at: now,
    to_applicant_message_id: null,
    to_company_message_id: null,
  }
  await getDbCollection("applications").insertOne(application)
  return application
}

/**
 * @description Initialize application object from query parameters
 */
const newApplicationToApplicationDocumentV2 = async (
  newApplication: INewApplicationV2NEWCompanySiret | INewApplicationV2NEWJobId,
  LbaJob: ILbaJob,
  recruteurEmail: string,
  caller?: string
) => {
  const now = new Date()
  const application: IApplication = {
    ...offreOrCompanyToCompanyFields(LbaJob),
    applicant_first_name: newApplication.applicant_first_name,
    applicant_last_name: newApplication.applicant_last_name,
    applicant_attachment_name: newApplication.applicant_file_name,
    applicant_email: newApplication.applicant_email.toLowerCase(),
    applicant_message_to_company: prepareMessageForMail(newApplication.message),
    applicant_phone: newApplication.applicant_phone,
    caller: caller,
    company_email: recruteurEmail.toLowerCase(),
    job_origin: LbaJob.type,
    _id: new ObjectId(),
    created_at: now,
    last_update_at: now,
    to_applicant_message_id: null,
    to_company_message_id: null,
  }
  await getDbCollection("applications").insertOne(application)
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
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2
 */
export const validateJob = async (application: INewApplicationV2): Promise<ILbaJob | { error: string }> => {
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
    const lbaCompany = await getDbCollection("bonnesboites").findOne({ siret: company_siret })
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
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2
 */
const scanFileContent = async (applicant_file_content: string): Promise<string> => {
  return (await isInfected(applicant_file_content)) ? "pièce jointe invalide" : "ok"
}

/**
 * checks if email is not disposable
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2
 */
export const validatePermanentEmail = (email: string): string => {
  if (isEmailBurner(email)) {
    return "email temporaire non autorisé"
  }
  return "ok"
}

async function getApplicationCountForItem(applicantEmail: string, LbaJob: ILbaJob) {
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
 * KBA 20240502 : TO DELETE WHEN SWITCHING TO V2
 */
const checkUserApplicationCount = async (applicantEmail: string, offreOrCompany: ILbaJob, caller: string | null | undefined): Promise<string> => {
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
const checkUserApplicationCountV2 = async (applicantEmail: string, LbaJob: ILbaJob, caller?: string): Promise<void> => {
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
    throw Boom.tooManyRequests(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_DAY)
  }

  if (itemApplicationCount >= MAX_MESSAGES_PAR_OFFRE_PAR_CANDIDAT) {
    throw Boom.tooManyRequests(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_OFFER)
  }

  if (callerApplicationCount >= MAX_MESSAGES_PAR_SIRET_PAR_CALLER) {
    throw Boom.tooManyRequests(BusinessErrorCodes.TOO_MANY_APPLICATIONS_PER_SIRET)
  }
}

interface IApplicationFeedback {
  id: string
  iv: string
  avis: string
  comment: string
  intention: string
}

/**
 * @description checks application feedback comment parameters
 * @param {Partial<IApplicationFeedback>} validable
 * @return {Promise<string>}
 */
export const validateFeedbackApplicationComment = async (validable: Partial<IApplicationFeedback>): Promise<string> => {
  const schema = Joi.object({
    id: Joi.string().required(),
    iv: Joi.string().required(),
    comment: Joi.string().required(),
    avis: Joi.optional(),
    intention: Joi.optional(),
  })
  await schema.validateAsync(validable)

  return "ok"
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
    data: { ...sanitizeApplicationForEmail(application.toObject()), ...images },
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
    company_name,
    company_naf,
    company_address,
    job_origin,
    job_title,
    job_id,
    caller,
    created_at,
    last_update_at,
  } = application
  return {
    applicant_email: sanitizeForEmail(applicant_email),
    applicant_first_name: sanitizeForEmail(applicant_first_name),
    applicant_last_name: sanitizeForEmail(applicant_last_name),
    applicant_phone: sanitizeForEmail(applicant_phone),
    applicant_attachment_name: sanitizeForEmail(applicant_attachment_name),
    applicant_message_to_company: sanitizeForEmail(applicant_message_to_company),
    company_recruitment_intention: sanitizeForEmail(company_recruitment_intention),
    company_feedback: sanitizeForEmail(company_feedback),
    company_feedback_date: company_feedback_date,
    company_siret: company_siret,
    company_email: sanitizeForEmail(company_email),
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

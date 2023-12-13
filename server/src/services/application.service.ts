import { isEmailBurner } from "burner-email-providers"
import Joi from "joi"
import type { EnforceDocument } from "mongoose"
import { oleoduc, writeData } from "oleoduc"
import { IApplication, IApplicationUI, ILbaCompany, JOB_STATUS } from "shared"
import { ApplicantIntention } from "shared/constants/application.js"
import { RECRUITER_STATUS } from "shared/constants/recruteur.js"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { logger } from "../common/logger.js"
import { Application, EmailBlacklist, LbaCompany, Recruiter, UserRecruteur } from "../common/model/index.js"
import { decryptWithIV } from "../common/utils/encryptString.js"
import { manageApiError } from "../common/utils/errorManager.js"
import { prepareMessageForMail } from "../common/utils/fileUtils.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import config from "../config.js"

import { createCancelJobLink, createLbaCompanyApplicationReplyLink, createProvidedJobLink, createUserRecruteurApplicationReplyLink } from "./appLinks.service.js"
import { BrevoEventStatus } from "./brevo.service.js"
import { scan } from "./clamav.service"
import { getOffreAvecInfoMandataire } from "./formulaire.service"
import mailer from "./mailer.service.js"
import { validateCaller } from "./queryValidator.service.js"

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

/**
 * @description Get applications by job id
 */
export const getApplication = (job_id: IApplication["job_id"]) => Application.find({ job_id }).lean()

/**
 * @description Get applications count by job id
 */
export const getApplicationCount = (job_id: IApplication["job_id"]) => Application.count({ job_id }).lean()

/**
 * @description Check if an email if blacklisted.
 * @param {string} email - Email
 * @return {Promise<boolean>}
 */
export const isEmailBlacklisted = async (email: string): Promise<boolean> => !!(await EmailBlacklist.findOne({ email }))

/**
 * @description Add an email address to the blacklist collection.
 * @param {string} email
 * @param {string} blacklistingOrigin
 * @return {Promise<void>}
 */
export const addEmailToBlacklist = async (email: string, blacklistingOrigin: string): Promise<void> => {
  try {
    await new EmailBlacklist({
      email,
      blacklisting_origin: blacklistingOrigin,
    }).save()
  } catch (err) {
    // catching unique address error
    logger.error(`Failed to save email to blacklist (${email}). Reason : ${err}`)
  }
}

/**
 * @description Get an application by message id
 * @param {string} messageId
 * @param {string} email
 * @returns {Promise<IApplication>}
 */
const findApplicationByMessageId = async ({ messageId, email }: { messageId: string; email: string }) =>
  Application.findOne({ company_email: email, to_company_message_id: messageId })

/**
 * @description Remove an email address form all bonnesboites where it is present
 * @param {string} email
 * @return {Promise<void>}
 */
export const removeEmailFromLbaCompanies = async (email: string) => {
  try {
    oleoduc(
      LbaCompany.find({ email }).cursor(),
      writeData((company) => {
        company.email = ""
        company.save()
      })
    )
  } catch (err) {
    logger.error(`Failed to clean bonnes boîtes emails from hardbounce (${email})`)
    // do nothing
  }
}

/**
 * Send an application email to a company and a confirmation email to the applicant
 */
export const sendApplication = async ({
  query,
  referer,
  shouldCheckSecret,
}: {
  query: Omit<IApplicationUI, "_id">
  referer: string | undefined
  shouldCheckSecret: boolean
}): Promise<{ error: string } | { result: "ok"; message: "messages sent" }> => {
  if (shouldCheckSecret && !query.secret) {
    return { error: "secret_missing" }
  } else if (shouldCheckSecret && query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" }
  } else if (!validateCaller({ caller: query.caller, referer })) {
    return { error: "missing_caller" }
  } else {
    let validationResult = await validateApplicationType(query)

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    validationResult = await validatePermanentEmail(query)

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    validationResult = await validateJobStatus(query)

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    const company_email = shouldCheckSecret ? query.company_email : decryptWithIV(query.company_email, query.iv) // utilisation email de test ou decrypt vrai mail crypté
    const decrypted_email = shouldCheckSecret ? decryptWithIV(query.crypted_company_email, query.iv) : company_email // présent uniquement pour les tests utilisateurs

    validationResult = await validateCompanyEmail({
      company_email,
      decrypted_email,
    })

    validationResult = await validateCompany(query, decrypted_email)

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    validationResult = await checkUserApplicationCount(query.applicant_email.toLowerCase())

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    validationResult = await scanFileContent(query)

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    try {
      const application = initApplication(query, company_email)

      const emailTemplates = getEmailTemplates(query.company_type)

      const fileContent = query.applicant_file_content

      const urlOfDetail = buildUrlOfDetail(publicUrl, query)
      const urlOfDetailNoUtm = urlOfDetail.replace(/(?<=&|\?)utm_.*?(&|$)/gim, "")
      const recruiterEmailUrls = await buildRecruiterEmailUrls(application)

      const searched_for_job_label = query.searched_for_job_label || ""

      const buildTopic = (aCompanyType, aJobTitle) => {
        let res = "Candidature"
        if (aCompanyType === "matcha") {
          res = `Candidature en alternance - ${aJobTitle}`
        } else {
          res = `Candidature spontanée en alternance ${searched_for_job_label ? "- " + searched_for_job_label : ""}`
        }
        return res
      }

      // Sends acknowledge email to "candidate" and application email to "company"
      const [emailCandidat, emailCompany] = await Promise.all([
        mailer.sendEmail({
          to: application.applicant_email,
          subject: `Votre candidature chez ${application.company_name}`,
          template: getEmailTemplate(emailTemplates.candidat),
          data: { ...application.toObject(), ...images, publicUrl, urlOfDetail, urlOfDetailNoUtm },
          attachments: [
            {
              filename: application.applicant_attachment_name,
              path: fileContent,
            },
          ],
        }),
        mailer.sendEmail({
          to: application.company_email,
          subject: buildTopic(application.job_origin, application.job_title),
          template: getEmailTemplate(emailTemplates.entreprise),
          data: { ...application.toObject(), ...images, ...recruiterEmailUrls, searched_for_job_label, urlOfDetail, urlOfDetailNoUtm },
          attachments: [
            {
              filename: application.applicant_attachment_name,
              path: fileContent,
            },
          ],
        }),
      ])

      application.to_applicant_message_id = emailCandidat.messageId
      if (emailCompany?.accepted?.length) {
        application.to_company_message_id = emailCompany.messageId
      } else {
        logger.info(`Application email rejected. applicant_email=${application.applicant_email} company_email=${application.company_email}`)
        throw new Error("Application email rejected")
      }

      await application.save()

      return { result: "ok", message: "messages sent" }
    } catch (err) {
      logger.error(`Error sending application. Reason : ${err}`)
      sentryCaptureException(err)
      if (query?.caller) {
        manageApiError({
          error: err,
          api_path: "applicationV1",
          caller: query.caller,
          errorTitle: "error_sending_application",
        })
      }
      return { error: "error_sending_application" }
    }
  }
}

/**
 * Build url to access item detail on LBA ui
 */
const buildUrlOfDetail = (publicUrl: string, query: Pick<IApplicationUI, "job_id" | "company_type" | "company_siret">): string => {
  const itemId = ((aCompanyType) => {
    if (aCompanyType === "peJob") {
      return query.job_id
    } else if (aCompanyType === "matcha") {
      return query.job_id
    } else if (aCompanyType !== "formation") {
      return query.company_siret || "siret"
    }
  })(query.company_type as string)
  const moreParams = ((aCompanyType) => {
    let res = ""
    if (aCompanyType === "matcha") {
      res = "&utm_source=jecandidate&utm_medium=email&utm_campaign=jecandidaterecruteur"
    }
    return res
  })(query.company_type)
  const kind = query.company_type

  return `${publicUrl}/recherche-apprentissage?display=list&page=fiche&type=${kind}&itemId=${itemId}${moreParams}`
}

/**
 * Build urls to add in email messages sent to the recruiter
 */
const buildRecruiterEmailUrls = async (application: IApplication) => {
  const utmRecruiterData = "&utm_source=jecandidate&utm_medium=email&utm_campaign=jecandidaterecruteur"

  // get the related recruiters to fetch it's establishment_id
  const recruiter = await Recruiter.findOne({ "jobs._id": application.job_id }).lean()
  let userRecruteur

  if (recruiter) {
    userRecruteur = await UserRecruteur.findOne({ establishment_id: recruiter.establishment_id }).lean()
  }

  const urls = {
    meetCandidateUrl:
      application.job_origin === "lba"
        ? createLbaCompanyApplicationReplyLink(application.company_siret, application.company_email, ApplicantIntention.ENTRETIEN, application)
        : createUserRecruteurApplicationReplyLink(userRecruteur, ApplicantIntention.ENTRETIEN, application),
    waitCandidateUrl:
      application.job_origin === "lba"
        ? createLbaCompanyApplicationReplyLink(application.company_siret, application.company_email, ApplicantIntention.NESAISPAS, application)
        : createUserRecruteurApplicationReplyLink(userRecruteur, ApplicantIntention.NESAISPAS, application),
    refuseCandidateUrl:
      application.job_origin === "lba"
        ? createLbaCompanyApplicationReplyLink(application.company_siret, application.company_email, ApplicantIntention.REFUS, application)
        : createUserRecruteurApplicationReplyLink(userRecruteur, ApplicantIntention.REFUS, application),
    lbaRecruiterUrl: `${config.publicUrl}/acces-recruteur?${utmRecruiterData}`,
    unsubscribeUrl: `${config.publicUrl}/desinscription?email=${application.company_email}${utmRecruiterData}`,
    lbaUrl: `${config.publicUrl}?${utmRecruiterData}`,
    faqUrl: `${config.publicUrl}/faq?${utmRecruiterData}`,
    jobProvidedUrl: "",
    cancelJobUrl: "",
  }

  if (application.job_id) {
    urls.jobProvidedUrl = createProvidedJobLink(userRecruteur, application.job_id, utmRecruiterData)
    urls.cancelJobUrl = createCancelJobLink(userRecruteur, application.job_id, utmRecruiterData)
  }

  return urls
}

/**
 * Initialize application object from query parameters
 */
const initApplication = (params: Omit<IApplicationUI, "_id">, company_email: string): EnforceDocument<IApplication, any> => {
  const res = new Application({
    ...params,
    applicant_attachment_name: params.applicant_file_name,
    applicant_email: params.applicant_email.toLowerCase(),
    applicant_message_to_company: prepareMessageForMail(params.message),
    company_email: company_email.toLowerCase(),
    job_origin: params.company_type,
  })

  return res
}

/**
 * @description Return template file path for given type
 * @param {string} type
 * @return {string}
 */
export const getEmailTemplate = (type = "mail-candidat"): string => {
  return getStaticFilePath(`./templates/${type}.mjml.ejs`)
}

interface IApplicationTemplates {
  candidat: string
  entreprise: string
}
/**
 * @description Return template file path for given type
 * @param {string} applicationType
 * @return {IApplicationTemplates}
 */
const getEmailTemplates = (applicationType: string): IApplicationTemplates => {
  if (applicationType === "matcha") {
    return {
      candidat: "mail-candidat-matcha",
      entreprise: "mail-candidature",
    }
  } else {
    return {
      candidat: "mail-candidat",
      entreprise: "mail-candidature",
    }
  }
}

/**
 * @description checks if job applied to is still active or exists
 */
export const validateJobStatus = async (validable: Partial<IApplicationUI>): Promise<"ok" | "offre expirée"> => {
  const { company_type, job_id } = validable

  if (company_type === "matcha" && job_id) {
    const job = await getOffreAvecInfoMandataire(job_id)

    if (!job || job.status !== RECRUITER_STATUS.ACTIF || job.jobs[0].job_status !== JOB_STATUS.ACTIVE) {
      return "offre expirée"
    }
  }

  return "ok"
}

/**
 * checks if company applied to exists in base
 */
export const validateCompany = async (validable: Partial<IApplicationUI>, company_email: string): Promise<"ok" | "société désinscrite" | "email société invalide"> => {
  const { company_siret, company_type } = validable

  if (company_type === "lba") {
    const lbaCompany = await LbaCompany.findOne({ siret: company_siret })
    if (!lbaCompany) {
      return "société désinscrite"
    } else if (lbaCompany.email?.toLowerCase() !== company_email.toLowerCase()) {
      return "email société invalide"
    }
  }

  return "ok"
}

/**
 * @description checks if attachment is corrupted
 * @param {Partial<IApplicationUI>} validable
 * @return {Promise<string>}
 */
const scanFileContent = async (validable: Pick<IApplicationUI, "applicant_file_content">): Promise<string> => {
  return (await scan(validable.applicant_file_content)) ? "pièce jointe invalide" : "ok"
}

interface ICompanyEmail {
  company_email: string
  decrypted_email?: string
}
/**
 * checks if company email is valid for sending an application
 */
export const validateCompanyEmail = async (validable: ICompanyEmail): Promise<string> => {
  const schema = Joi.object({
    company_email: Joi.string().email().required(),
    decrypted_email: Joi.optional(),
  })
  try {
    await schema.validateAsync(validable)
  } catch (err) {
    return "email société invalide"
  }

  return "ok"
}

/**
 * checks if email is not disposable
 */
export const validatePermanentEmail = async (validable: Partial<IApplicationUI>): Promise<string> => {
  if (isEmailBurner(validable?.applicant_email ?? "")) {
    return "email temporaire non autorisé"
  }
  return "ok"
}

/**
 * @description Checks if application type matches params
 * @param {Partial<IApplicationUI>} validable
 * @return {<string>}
 */
export const validateApplicationType = (validable: Partial<IApplicationUI>) => {
  const { company_type, company_siret, job_id } = validable
  if ((company_type === "matcha" && !job_id) || (company_type === "lba" && (!company_siret || job_id))) {
    return "paramètres sociétés non autorisés"
  }
  return "ok"
}

/**
 * @description checks if email's owner has not sent more than allowed count of applications per day
 * @param {string} applicantEmail
 * @return {Promise<string>}
 */
const checkUserApplicationCount = async (applicantEmail: string): Promise<string> => {
  const start = new Date()
  start.setHours(0, 0, 0, 0)

  const end = new Date()
  end.setHours(23, 59, 59, 999)

  const appCount = await Application.countDocuments({
    applicant_email: applicantEmail.toLowerCase(),
    created_at: { $gte: start, $lt: end },
  })

  if (appCount > config.maxApplicationPerDay) {
    return "max candidatures atteint"
  } else {
    return "ok"
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
 * @param {IApplication} application
 * @param {string} intention
 * @param {string} email
 * @param {string} phone
 * @param {string} comment
 * @return {Promise<void>}
 */
export const sendMailToApplicant = async ({
  application,
  intention,
  email,
  phone,
  comment,
}: {
  application: EnforceDocument<IApplication, any>
  intention: string
  email: string
  phone: string
  comment: string
}): Promise<void> => {
  switch (intention) {
    case ApplicantIntention.ENTRETIEN: {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse positive de ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-entretien"),
        data: { ...application.toObject(), ...images, email, phone, comment },
      })
      break
    }
    case ApplicantIntention.NESAISPAS: {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse de ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-nsp"),
        data: { ...application.toObject(), ...images, email, phone, comment },
      })
      break
    }
    case ApplicantIntention.REFUS: {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse négative de ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-refus"),
        data: { ...application.toObject(), ...images, comment },
      })
      break
    }
    default:
      break
  }
}

/**
 * @description updates application and triggers action from email webhook
 */
export const updateApplicationStatus = async ({ payload }: { payload: any }): Promise<void> => {
  /* Format payload cf. https://developers.brevo.com/docs/how-to-use-webhooks
      {
        "event": "delivered",
        "email": "example@example.com",
        "id": 26224,
        "date": "YYYY-MM-DD HH:mm:ss",
        "ts": 1598634509,
        "message-id": "<xxxxxxxxxxxx.xxxxxxxxx@domain.com>",
        "ts_event": 1598034509,
        "subject": "Subject Line",
        "tag": "[\"transactionalTag\"]",
        "sending_ip": "185.41.28.109",
        "ts_epoch": 1598634509223,
        "tags": [
          "myFirstTransactional"
        ]
      }
  */

  const { event, subject, email } = payload

  if (event !== BrevoEventStatus.HARD_BOUNCE) {
    return
  }

  if (!subject.startsWith("Candidature en alternance") && !subject.startsWith("Candidature spontanée")) {
    // les messages qui ne sont pas de candidature vers une entreprise sont ignorés
    return
  }

  const application = await findApplicationByMessageId({
    messageId: payload["message-id"],
    email,
  })

  if (!application) {
    logger.error(`Application webhook : application not found. message_id=${payload["message-id"]} email=${email} subject=${subject}`)
    return
  }

  await addEmailToBlacklist(email, application.job_origin ?? "unknown")

  if (application.job_origin === "lba") {
    await removeEmailFromLbaCompanies(email)
  } else if (application.job_origin === "matcha") {
    await warnMatchaTeamAboutBouncedEmail({ application })
  }

  await notifyHardbounceToApplicant({ application })
}

/**
 * sends email notification to applicant if it's application hardbounced
 */
const notifyHardbounceToApplicant = async ({ application }: { application: EnforceDocument<IApplication, any> }): Promise<void> => {
  await mailer.sendEmail({
    to: application.applicant_email,
    subject: `Votre candidature n'a pas pu être envoyée à ${application.company_name}`,
    template: getEmailTemplate("mail-candidat-hardbounce"),
    data: { ...application.toObject(), ...images },
  })
}

/**
 * sends email notification to applicant if it's application hardbounced
 */
const warnMatchaTeamAboutBouncedEmail = async ({ application }: { application: EnforceDocument<IApplication, any> }): Promise<void> => {
  await mailer.sendEmail({
    to: config.transactionalEmail,
    subject: `Votre candidature n'a pas pu être envoyée à ${application.company_name}`,
    template: getEmailTemplate("mail-matcha-hardbounce"),
    data: { ...application.toObject(), ...images },
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
  const applicationCountByJob: IApplicationCount[] = await Application.aggregate([
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

  return applicationCountByJob
}

/**
 * @description retourne le nombre de candidatures enregistrées par siret de société fournis
 * @param {ILbaCompany["siret"][]} sirets
 * @returns {Promise<IApplicationCount[]>} token data
 */
export const getApplicationByCompanyCount = async (sirets: ILbaCompany["siret"][]): Promise<IApplicationCount[]> => {
  const applicationCountByCompany: IApplicationCount[] = await Application.aggregate([
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

  return applicationCountByCompany
}

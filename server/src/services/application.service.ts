import { isEmailBurner } from "burner-email-providers"
import Joi from "joi"
import type { EnforceDocument } from "mongoose"
import { oleoduc, writeData } from "oleoduc"
import { IApplication, IApplicationUI, ILbaCompany } from "shared"

import { getStaticFilePath } from "@/common/utils/getStaticFilePath"

import { logger } from "../common/logger.js"
import { Application, EmailBlacklist, LbaCompany } from "../common/model/index.js"
import { decryptWithIV, encryptIdWithIV } from "../common/utils/encryptString.js"
import { manageApiError } from "../common/utils/errorManager.js"
import { prepareMessageForMail } from "../common/utils/fileUtils.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import config from "../config.js"

import { BrevoEventStatus } from "./brevo.service.js"
import { scan } from "./clamav.service"
import { JOB_STATUS, RECRUITER_STATUS } from "./constant.service"
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
 * @param {string} type
 * @param {string} email
 * @returns {Promise<IApplication>}
 */
const findApplicationByTypeAndMessageId = async ({ messageId, type, email }: { messageId: string; type: string; email: string }) =>
  Application.findOne(type === "application" ? { company_email: email, to_company_message_id: messageId } : { applicant_email: email, to_applicant_message_id: messageId })

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

      const encryptedId = encryptIdWithIV(application.id)

      const emailTemplates = getEmailTemplates(query.company_type)

      const fileContent = query.applicant_file_content

      const urlOfDetail = buildUrlOfDetail(publicUrl, query)
      const urlOfDetailNoUtm = urlOfDetail.replace(/(?<=&|\?)utm_.*?(&|$)/gim, "")
      const recruiterEmailUrls = buildRecruiterEmailUrls({
        publicUrl,
        application,
        encryptedId,
      })

      const buildTopic = (aCompanyType, aJobTitle) => {
        let res = "Candidature"
        if (aCompanyType === "matcha") {
          res = `Candidature en alternance - ${aJobTitle}`
        } else {
          res = `Candidature spontanée en alternance`
        }
        return res
      }

      const searched_for_job_label = query.searched_for_job_label || ""

      // Sends acknowledge email to "candidate" and application email to "company"
      const [emailCandidat, emailCompany] = await Promise.all([
        mailer.sendEmail({
          to: application.applicant_email,
          subject: `Votre candidature chez ${application.company_name}`,
          template: getEmailTemplate(emailTemplates.candidat),
          data: { ...application.toObject(), ...images, ...encryptedId, publicUrl, urlOfDetail, urlOfDetailNoUtm },
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
const buildRecruiterEmailUrls = ({ publicUrl, application, encryptedId }: { publicUrl: string; application: EnforceDocument<IApplication, any>; encryptedId: any }) => {
  const utmRecruiterData = "&utm_source=jecandidate&utm_medium=email&utm_campaign=jecandidaterecruteur"
  const candidateData = `&fn=${application.toObject().applicant_first_name}&ln=${application.toObject().applicant_last_name}`
  const encryptedData = `&id=${encryptedId.id}&iv=${encryptedId.iv}`

  const urls = {
    meetCandidateUrl: `${publicUrl}/formulaire-intention?intention=entretien${encryptedData}${candidateData}${utmRecruiterData}`,
    waitCandidateUrl: `${publicUrl}/formulaire-intention?intention=ne_sais_pas${encryptedData}${candidateData}${utmRecruiterData}`,
    refuseCandidateUrl: `${publicUrl}/formulaire-intention?intention=refus${encryptedData}${candidateData}${utmRecruiterData}`,
    lbaRecruiterUrl: `${publicUrl}/acces-recruteur?${utmRecruiterData}`,
    unsubscribeUrl: `${publicUrl}/desinscription?email=${application.company_email}${utmRecruiterData}`,
    lbaUrl: `${publicUrl}?${utmRecruiterData}`,
    jobProvidedUrl: `${publicUrl}/espace-pro/offre/${application.job_id}/provided?${utmRecruiterData}`,
    cancelJobUrl: `${publicUrl}/espace-pro/offre/${application.job_id}/cancel?${utmRecruiterData}`,
    faqUrl: `${publicUrl}/faq?${utmRecruiterData}`,
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
 * @param {string} type
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
export const sendNotificationToApplicant = async ({
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
    case "entretien": {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse positive de ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-entretien"),
        data: { ...application.toObject(), ...images, email, phone, comment },
      })
      break
    }
    case "ne_sais_pas": {
      mailer.sendEmail({
        to: application.applicant_email,
        subject: `Réponse de ${application.company_name}`,
        template: getEmailTemplate("mail-candidat-nsp"),
        data: { ...application.toObject(), ...images, email, phone, comment },
      })
      break
    }
    case "refus": {
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
  /* Format payload
      {
        event : "unique_opened",
        id: 497470,
        date: "2021-12-27 14:12:54",
        ts: 1640610774,
        message-id: "<48ea8e31-715e-d929-58af-ca0c457d2654@apprentissage.beta.gouv.fr>",
        email:"john.doe@mail.com",
        ts_event: 1640610774,
        subject: "Votre candidature chez PARIS BAGUETTE FRANCE CHATELET EN ABREGE",
        sending_ip: "93.23.252.236",
        ts_epoch: 1640610774707
      }*/

  const event = payload.event

  let messageType = "application"
  if (payload.subject.startsWith("Réponse")) {
    // les messages de notifications intention recruteur -> candidat sont ignorés
    return
  } else if (payload.subject.startsWith("Votre candidature chez")) {
    messageType = "applicationAck"
  }

  const application = await findApplicationByTypeAndMessageId({
    type: messageType,
    messageId: payload["message-id"],
    email: payload.email,
  })

  if (!application) {
    logger.error(`Application webhook : application not found. message_id=${payload["message-id"]} email=${payload.email} subject=${payload.subject}`)
    return
  }

  if (event === BrevoEventStatus.HARD_BOUNCE && messageType === "application") {
    await addEmailToBlacklist(payload.email, application.job_origin ?? "unknown")

    if (application.job_origin === "lbb" || application.job_origin === "lba") {
      await removeEmailFromLbaCompanies(payload.email)
    } else if (application.job_origin === "matcha") {
      await warnMatchaTeamAboutBouncedEmail({ application })
    }

    await notifyHardbounceToApplicant({ application })
  }
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

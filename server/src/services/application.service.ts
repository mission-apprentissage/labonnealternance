import { isEmailBurner } from "burner-email-providers"
import path from "path"
import { oleoduc, writeData } from "oleoduc"
import { Application, LbaCompany, EmailBlacklist } from "../common/model/index.js"
import { manageApiError } from "../common/utils/errorManager.js"
import { decryptWithIV, encryptIdWithIV } from "../common/utils/encryptString.js"
import { validateCaller } from "./queryValidator.service.js"
import { logger } from "../common/logger.js"
import { prepareMessageForMail } from "../common/utils/fileUtils.js"
import config from "../config.js"
import __dirname from "../common/dirname.js"
import { BrevoEventStatus } from "./brevo.service.js"
import mailer from "./mailer.service.js"
import { sentryCaptureException } from "../common/utils/sentryUtils.js"
import { IApplication } from "../common/model/schema/application/applications.types.js"
import { IJobs } from "../common/model/schema/jobs/jobs.types.js"
import { ILbaCompany } from "../common/model/schema/lbaCompany/lbaCompany.types.js"

import { Document } from "mongoose"
import Joi from "joi"
import { scan } from "./clamav.service.js"

const publicUrl = config.publicUrl
const publicUrlEspacePro = config.publicUrlEspacePro
const currentDirname = __dirname(import.meta.url)

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
 * @param {IJobs["_id"]} job_id
 */
export const getApplication = (job_id: IJobs["_id"]) => Application.find({ job_id }).lean()

/**
 * @description Get applications count by job id
 * @param {IJobs["_id"]} job_id
 */
export const getApplicationCount = (job_id: IJobs["_id"]) => Application.count({ job_id }).lean()

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
 * @returns {Promise<IApplication & Document<any, any, IApplication>>}
 */
const findApplicationByTypeAndMessageId = async ({
  messageId,
  type,
  email,
}: {
  messageId: string
  type: string
  email: string
}): Promise<IApplication & Document<any, any, IApplication>> => {
  return await Application.findOne(
    type === "application" ? { company_email: email, to_company_message_id: messageId } : { applicant_email: email, to_applicant_message_id: messageId }
  )
}

/**
 * @description Remove an email address form all bonnesboites where it is present
 * @param {string} email
 * @return {Promise<void>}
 */
export const removeEmailFromBonnesBoites = async (email: string) => {
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
 * @description Send an application email to a company and a confirmation email to the applicant
 * @param {any} query
 * @param {string} referer
 * @param {boolean} shouldCheckSecret
 * @return {Promise<any>}
 */
export const sendApplication = async ({ query, referer, shouldCheckSecret }: { query: any; referer: string; shouldCheckSecret: boolean }): Promise<any> => {
  if (shouldCheckSecret && !query.secret) {
    return { error: "secret_missing" }
  } else if (shouldCheckSecret && query.secret !== config.secretUpdateRomesMetiers) {
    return { error: "wrong_secret" }
  } else if (!validateCaller({ caller: query.caller, referer })) {
    return { error: "missing_caller" }
  } else {
    let validationResult = await validateSendApplication(query)

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    validationResult = await validatePermanentEmail(query)

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    validationResult = await scanFileContent(query)

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    const company_email = shouldCheckSecret ? query.company_email : decryptWithIV(query.company_email, query.iv) // utilisation email de test ou decrypt vrai mail crypté
    const crypted_email = shouldCheckSecret ? decryptWithIV(query.crypted_company_email, query.iv) : "" // présent uniquement pour les tests utilisateurs

    validationResult = await validateCompanyEmail({
      company_email,
      crypted_email,
    })

    if (validationResult !== "ok") {
      return { error: validationResult }
    }

    validationResult = await checkUserApplicationCount(query.applicant_email.toLowerCase())

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
          data: { ...application.toObject(), ...images, ...recruiterEmailUrls, urlOfDetail, urlOfDetailNoUtm },
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
 * @description Build url to access item detail on LBA ui
 * @param {string} publicUrl
 * @param {any} query
 * @return {string}
 */
const buildUrlOfDetail = (publicUrl: string, query: any): string => {
  const itemId = ((aCompanyType) => {
    if (aCompanyType === "peJob") {
      return query.job_id
    } else if (aCompanyType === "matcha") {
      return query.job_id
    } else if (aCompanyType !== "formation") {
      return query.company_siret || "siret"
    }
  })(query.company_type)
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
 * @description Build urls to add in email messages sent to the recruiter
 * @param {string} publicUrl
 * @param {IApplication} application
 * @param {object} encryptedId
 * @return {object}
 */
const buildRecruiterEmailUrls = ({
  publicUrl,
  application,
  encryptedId,
}: {
  publicUrl: string
  application: IApplication & Document<any, any, IApplication>
  encryptedId: any
}): any => {
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
    jobProvidedUrl: `${publicUrlEspacePro}/offre/${application.job_id}/provided?${utmRecruiterData}`,
    cancelJobUrl: `${publicUrlEspacePro}/offre/${application.job_id}/cancel?${utmRecruiterData}`,
    faqUrl: `${publicUrl}/faq?${utmRecruiterData}`,
  }

  return urls
}

/**
 * @description Initialize application object from query parameters
 * @param {any} params
 * @param {string} company_email
 * @return {IApplication}
 */
const initApplication = (params: any, company_email: string): IApplication & Document<any, any, IApplication> => {
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
  return path.join(currentDirname, `../assets/templates/${type}.mjml.ejs`)
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

interface IApplicationParameters {
  applicant_file_name: string
  applicant_file_content: string
  applicant_first_name: string
  applicant_last_name: string
  applicant_email: string
  applicant_phone: string
  company_email: string
  iv: string
  company_naf?: string
  company_name?: string
  job_id?: string
  job_title?: string
  company_siret?: string
  company_type?: string
  company_address?: string
  caller?: string
}
/**
 * @description checks if values are valid for sending an application
 * @param {Partial<IApplicationParameters>} validable
 * @return {Promise<string>}
 */
export const validateSendApplication = async (validable: Partial<IApplicationParameters>): Promise<string> => {
  const schema = Joi.object({
    applicant_file_name: Joi.string()
      .required()
      .pattern(/((.*?))(\.)+(docx|pdf)$/i),
    applicant_file_content: Joi.string().required().max(4215276),
    applicant_first_name: Joi.string().required().max(50),
    applicant_last_name: Joi.string().required().max(50),
    applicant_phone: Joi.string()
      .pattern(/^0[1-9]\d{8}$/)
      .required(),
    applicant_email: Joi.string().email().required(),
    company_email: Joi.string().required(),
    iv: Joi.string().required(),
    company_naf: Joi.string().required(),
    company_name: Joi.string().required(),
    job_title: Joi.string().required(),
    company_type: Joi.string().required(),
    company_siret: Joi.string().required(),
    company_address: Joi.string().required(),
    job_id: Joi.optional(),
    caller: Joi.optional(),
    message: Joi.optional(),
    secret: Joi.optional(),
    crypted_company_email: Joi.optional(),
  })
  try {
    await schema.validateAsync(validable)
  } catch (err) {
    return "données de candidature invalides"
  }

  return "ok"
}

/**
 * @description checks if attachment is corrupted
 * @param {Partial<IApplicationParameters>} validable
 * @return {Promise<string>}
 */
const scanFileContent = async (validable: Partial<IApplicationParameters>): Promise<string> => {
  return (await scan(validable.applicant_file_content)) ? "pièce jointe invalide" : "ok"
}

interface ICompanyEmail {
  company_email: string
  crypted_email?: string
}
/**
 * @description checks if company email is valid for sending an application
 * @param {ICompanyEmail} validable
 * @return {Promise<string>}
 */
export const validateCompanyEmail = async (validable: ICompanyEmail): Promise<string> => {
  const schema = Joi.object({
    company_email: Joi.string().email().required(),
    crypted_email: Joi.optional(),
  })
  try {
    await schema.validateAsync(validable)
  } catch (err) {
    return "email société invalide"
  }

  return "ok"
}

/**
 * @description checks if email is not disposable
 * @param {Partial<IApplicationParameters>} validable
 * @return {Promise<string>}
 */
export const validatePermanentEmail = async (validable: Partial<IApplicationParameters>): Promise<string> => {
  if (isEmailBurner(validable.applicant_email)) {
    return "email temporaire non autorisé"
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
  application: IApplication & Document<any, any, IApplication>
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
 * @param {any} payload
 * @return {Promise<void>}
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
    await addEmailToBlacklist(payload.email, application.job_origin)

    if (application.job_origin === "lbb" || application.job_origin === "lba") {
      await removeEmailFromBonnesBoites(payload.email)
    } else if (application.job_origin === "matcha") {
      await warnMatchaTeamAboutBouncedEmail({ application })
    }

    await notifyHardbounceToApplicant({ application })
  }
}

/**
 * @description sends email notification to applicant if it's application hardbounced
 * @param {IApplication & Document<any, any, IApplication>} application
 * @return {Promise<void>}
 */
const notifyHardbounceToApplicant = async ({ application }: { application: IApplication & Document<any, any, IApplication> }): Promise<void> => {
  mailer.sendEmail({
    to: application.applicant_email,
    subject: `Votre candidature n'a pas pu être envoyée à ${application.company_name}`,
    template: getEmailTemplate("mail-candidat-hardbounce"),
    data: { ...application.toObject(), ...images },
  })
}

/**
 * @description sends email notification to applicant if it's application hardbounced
 * @param {IApplication & Document<any, any, IApplication>} application
 * @return {Promise<void>}
 */
const warnMatchaTeamAboutBouncedEmail = async ({ application }: { application: IApplication & Document<any, any, IApplication> }): Promise<void> => {
  mailer.sendEmail({
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
export const getApplicationByJobCount = async (job_ids: IJobs["_id"][]): Promise<IApplicationCount[]> => {
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

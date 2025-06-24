import brevo from "@getbrevo/brevo"
import { EApplicantRole } from "shared/constants/rdva"

import { getDbCollection } from "@/common/utils/mongodbUtils"
import { BlackListOrigins } from "@/services/application.service"
import { BrevoEventStatus } from "@/services/brevo.service"
import { processBlacklistedEmail } from "@/services/emails.service"

import { logger } from "../../common/logger"
import { sentryCaptureException } from "../../common/utils/sentryUtils"
import { notifyToSlack } from "../../common/utils/slackUtils"
import config from "../../config"

export enum BrevoBlockedReasons {
  UNSUBSCRIBED_VIA_MA = "unsubscribedViaMA",
  UNSUBSCRIBED_VIA_EMAIL = "unsubscribedViaEmail",
  UNSUBSCRIBED_VIA_API = "unsubscribedViaApi",
  ADMIN_BLOCKED = "adminBlocked",
  HARD_BOUNCE = "hardBounce",
  SPAM = "contactFlaggedAsSpam",
}

export const saveBlacklistEmails = async (contacts) => {
  for (let i = 0; i < contacts.length; ++i) {
    const email = contacts[i].email.toLowerCase()
    const reasonCode: BrevoBlockedReasons = contacts[i].reason.code as BrevoBlockedReasons
    const blackListedEmail = await getDbCollection("emailblacklists").findOne({ email })

    if (!blackListedEmail) {
      let reason: BrevoEventStatus
      switch (reasonCode) {
        case BrevoBlockedReasons.UNSUBSCRIBED_VIA_API:
        case BrevoBlockedReasons.UNSUBSCRIBED_VIA_EMAIL:
        case BrevoBlockedReasons.UNSUBSCRIBED_VIA_MA: {
          reason = BrevoEventStatus.UNSUBSCRIBED
          break
        }
        case BrevoBlockedReasons.HARD_BOUNCE: {
          reason = BrevoEventStatus.HARD_BOUNCE
          break
        }
        case BrevoBlockedReasons.SPAM: {
          reason = BrevoEventStatus.SPAM
          break
        }
        default: {
          reason = BrevoEventStatus.BLOCKED
          break
        }
      }

      // identifier la source
      let origin: BlackListOrigins = BlackListOrigins.UNKNOWN

      if (await getDbCollection("applications").findOne({ company_email: email })) {
        origin = BlackListOrigins.CANDIDATURE_SPONTANEE_RECRUTEUR
      } else if (await getDbCollection("applicants").findOne({ email })) {
        origin = BlackListOrigins.CANDIDATURE_SPONTANEE_CANDIDAT
      } else if (await getDbCollection("users").findOne({ email, role: EApplicantRole.CANDIDAT })) {
        origin = BlackListOrigins.PRDV_CANDIDAT
      } else if (await getDbCollection("eligible_trainings_for_appointments").findOne({ lieu_formation_email: email })) {
        origin = BlackListOrigins.PRDV_CFA
      } else if (await getDbCollection("userswithaccounts").findOne({ email })) {
        origin = BlackListOrigins.USER_WITH_ACCOUNT
      }

      await processBlacklistedEmail(email, origin, reason)
    }
  }
}

const updateBlockedEmails = async ({ AllAddresses }: { AllAddresses?: boolean }) => {
  logger.info(`Début mise à jour blacklist Brevo`)

  const clientBrevo = new brevo.TransactionalEmailsApi()
  clientBrevo.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, config.smtp.brevoApiKey)

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() < 9 ? "0" : ""}${yesterday.getMonth() + 1}-${yesterday.getDate() < 10 ? "0" : ""}${yesterday.getDate()}`
  const limit = 100
  const senders = [config.transactionalEmail, config.publicEmail]
  let total = 0
  let offset = 0
  const startDate = AllAddresses ? todayStr : undefined
  const endDate = AllAddresses ? todayStr : undefined

  let result = await clientBrevo.getTransacBlockedContacts(startDate, endDate, limit, offset, senders)

  if (!result.body.count || result.body.count === 0) return

  total = result.body.count

  if (!Number.isFinite(total)) {
    return
  }

  while (offset < total) {
    await saveBlacklistEmails(result.body.contacts)

    offset += limit
    result = await clientBrevo.getTransacBlockedContacts(startDate, endDate, limit, offset, senders)
  }
}

let blacklistedAddressCount = 0

export async function updateBrevoBlockedEmails({ AllAddresses }: { AllAddresses?: boolean }) {
  blacklistedAddressCount = 0

  try {
    logger.info(" -- Import blocked email addresses -- ")

    await updateBlockedEmails({ AllAddresses })

    await notifyToSlack({
      subject: "BREVO",
      message: `Mise à jour des adresses emails bloquées terminée. ${blacklistedAddressCount} adresse(s) bloquée(s).`,
    })

    logger.info(`Fin traitement`)
  } catch (error) {
    sentryCaptureException(error)
    logger.error(error)
    await notifyToSlack({ subject: "BREVO", message: `Échec de la mise à jour des adresses emails bloquées` })
  }
}

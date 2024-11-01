import { EApplicantRole } from "shared/constants/rdva"
import SibApiV3Sdk from "sib-api-v3-sdk"

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
        origin = BlackListOrigins.SPONT
      }

      if (origin === BlackListOrigins.UNKNOWN && (await getDbCollection("applications").findOne({ applicant_email: email }))) {
        origin = BlackListOrigins.SPONT_CANDIDAT
      }

      if (origin === BlackListOrigins.UNKNOWN && (await getDbCollection("users").findOne({ email, role: EApplicantRole.CANDIDAT }))) {
        origin = BlackListOrigins.PRDV_CANDIDAT
      }

      if (origin === BlackListOrigins.UNKNOWN && (await getDbCollection("eligible_trainings_for_appointments").findOne({ lieu_formation_email: email }))) {
        origin = BlackListOrigins.PRDV_CFA
      }

      if (origin === BlackListOrigins.UNKNOWN && (await getDbCollection("userswithaccounts").findOne({ email }))) {
        origin = BlackListOrigins.USER_WITH_ACCOUNT
      }

      await processBlacklistedEmail(email, origin, reason)
    }
  }
}

const updateBlockedEmails = async ({ AllAddresses }: { AllAddresses?: boolean }) => {
  logger.info(`Début mise à jour blacklist Brevo`)

  const defaultClient = SibApiV3Sdk.ApiClient.instance
  const apiKey = defaultClient.authentications["api-key"]
  apiKey.apiKey = config.smtp.brevoApiKey

  const apiInstance = new SibApiV3Sdk.TransactionalEmailsApi()

  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)

  const todayStr = `${yesterday.getFullYear()}-${yesterday.getMonth() < 9 ? "0" : ""}${yesterday.getMonth() + 1}-${yesterday.getDate() < 10 ? "0" : ""}${yesterday.getDate()}`
  const limit = 100
  const senders = [config.transactionalEmail, config.publicEmail]
  let total = 0
  let offset = 0
  const startDate = AllAddresses ? null : todayStr
  const endDate = AllAddresses ? null : todayStr

  const opts = {
    startDate,
    endDate,
    limit,
    offset,
    senders,
  }

  let result = await apiInstance.getTransacBlockedContacts(opts)

  total = result.count

  if (!Number.isFinite(total)) {
    return
  }

  while (offset < total) {
    await saveBlacklistEmails(result.contacts)

    offset += limit
    result = await apiInstance.getTransacBlockedContacts({ ...opts, offset })
  }
}

let blacklistedAddressCount = 0

export default async function ({ AllAddresses }: { AllAddresses?: boolean }) {
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

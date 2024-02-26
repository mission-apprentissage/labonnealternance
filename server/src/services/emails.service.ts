import { addEmailToBlacklist, processApplicationHardbounceEvent, removeEmailFromLbaCompanies } from "@/services/application.service"
import { disableEligibleTraininForAppointmentWithEmail, processAppointmentToApplicantWebhookEvent, processAppointmentToCfaWebhookEvent } from "@/services/appointment.service"

import { BrevoEventStatus } from "./brevo.service"

// webhook events excluding hardbounce
export const processWebhookEvent = async (payload) => {
  const shouldContinue = await processAppointmentToCfaWebhookEvent(payload)
  if (shouldContinue) {
    await processAppointmentToApplicantWebhookEvent(payload)
  }
}

/**
 *  réagit à un hardbounce non lié à aux autres processeurs de webhook email
 */
export const processHardBounceWebhookEvent = async (payload) => {
  const { event, email } = payload

  let hardbounceOrigin = "campaign"

  if (event === BrevoEventStatus.HARD_BOUNCE) {
    if (await processApplicationHardbounceEvent(payload)) {
      hardbounceOrigin = "lba"
    }

    if (await isHardbounceEventFromAppointment(payload)) {
      hardbounceOrigin = "prise_de_rdv"
    }

    await Promise.all([addEmailToBlacklist(email, hardbounceOrigin), await removeEmailFromLbaCompanies(email), await disableEligibleTraininForAppointmentWithEmail(email)])
  } else {
    throw new Error("Non hardbounce event received on hardbounce webhook route")
  }
}

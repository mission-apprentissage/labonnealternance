import { addEmailToBlacklist, processApplicationHardbounceEvent, removeEmailFromLbaCompanies } from "@/services/application.service"
import {
  isHardbounceEventFromAppointmentApplicant,
  isHardbounceEventFromAppointmentCfa,
  processAppointmentToApplicantWebhookEvent,
  processAppointmentToCfaWebhookEvent,
} from "@/services/appointment.service"

import { BrevoEventStatus } from "./brevo.service"
import { disableEligibleTraininForAppointmentWithEmail } from "./eligibleTrainingsForAppointment.service"
import { isHardbounceEventFromEtablissement } from "./etablissement.service"
import { cleanHardbouncedAppointmentUser } from "./user.service"

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

  let origin = "campaign"

  if (event === BrevoEventStatus.HARD_BOUNCE) {
    if (await processApplicationHardbounceEvent(payload)) {
      origin = "candidature_spontanee"
    }

    if (await isHardbounceEventFromAppointmentCfa(payload)) {
      origin = "prise_de_rdv"
    }

    if (await isHardbounceEventFromAppointmentApplicant(payload)) {
      origin = "candidat_prise_de_rdv"
    }

    if (await isHardbounceEventFromEtablissement(payload)) {
      origin = "invitation_prise_de_rdv"
    }

    await processBlacklistedEmail(email, origin)
  } else {
    throw new Error("Non hardbounce event received on hardbounce webhook route")
  }
}

export const processBlacklistedEmail = async (email: string, origin: string) => {
  await Promise.all([
    addEmailToBlacklist(email, origin),
    removeEmailFromLbaCompanies(email),
    cleanHardbouncedAppointmentUser(email),
    disableEligibleTraininForAppointmentWithEmail(email),
  ])
}

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
type IBrevoWebhookEvent = {
  event: BrevoEventStatus
  email: string
  id: number
  date: string
  "message-id": string
  reason: string
  tag: string
  sending_ip: string
  ts_epoch: number
  template_id: string
}

/**
 *  réagit à un hardbounce non lié à aux autres processeurs de webhook email
 */
export const processHardBounceWebhookEvent = async (payload: IBrevoWebhookEvent) => {
  const { event, email } = payload

  let origin = "campaign"

  if ([BrevoEventStatus.HARD_BOUNCE, BrevoEventStatus.BLOCKED, BrevoEventStatus.SPAM, BrevoEventStatus.UNSUBSCRIBED].includes(event)) {
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

    await processBlacklistedEmail(email, origin, event)
  } else {
    throw new Error("Non hardbounce event received on hardbounce webhook route")
  }
}

export const processBlacklistedEmail = async (email: string, origin: string, event: BrevoEventStatus) => {
  await Promise.all([
    addEmailToBlacklist(email, origin, event),
    removeEmailFromLbaCompanies(email),
    cleanHardbouncedAppointmentUser(email),
    disableEligibleTraininForAppointmentWithEmail(email),
  ])
}

import {
  addEmailToBlacklist,
  BlackListOrigins,
  processApplicationCandidateHardbounceEvent,
  processApplicationHardbounceEvent,
  removeEmailFromLbaCompanies,
} from "@/services/application.service"
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
export type IBrevoWebhookEvent = {
  event: BrevoEventStatus
  email: string
  id: number
  date: string
  "message-id": string
  reason: string | undefined
  subject: string | undefined
  tag: string
  sending_ip: string
  ts_epoch: number
  template_id: number
}

/**
 *  réagit à un hardbounce non lié à aux autres processeurs de webhook email
 */
export const processHardBounceWebhookEvent = async (payload: IBrevoWebhookEvent) => {
  const { event, email } = payload

  let origin = BlackListOrigins.CAMPAIGN

  if ([BrevoEventStatus.HARD_BOUNCE, BrevoEventStatus.BLOCKED, BrevoEventStatus.SPAM, BrevoEventStatus.UNSUBSCRIBED].includes(event)) {
    if (await processApplicationHardbounceEvent(payload)) {
      origin = BlackListOrigins.CANDIDATURE_SPONTANEE_RECRUTEUR
    }

    if (await processApplicationCandidateHardbounceEvent(payload)) {
      origin = BlackListOrigins.CANDIDATURE_SPONTANEE_CANDIDAT
    }

    if (await isHardbounceEventFromAppointmentCfa(payload)) {
      origin = BlackListOrigins.PRDV_CFA
    }

    if (await isHardbounceEventFromAppointmentApplicant(payload)) {
      origin = BlackListOrigins.PRDV_CANDIDAT
    }

    if (await isHardbounceEventFromEtablissement(payload)) {
      origin = BlackListOrigins.PRDV_INVITATION
    }

    await processBlacklistedEmail(email, origin, event)
  } else {
    throw new Error("Non hardbounce event received on hardbounce webhook route")
  }
}

export const processBlacklistedEmail = async (email: string, origin: BlackListOrigins, event: BrevoEventStatus) => {
  await Promise.all([
    addEmailToBlacklist(email, origin, event),
    removeEmailFromLbaCompanies(email),
    cleanHardbouncedAppointmentUser(email),
    disableEligibleTraininForAppointmentWithEmail(email),
  ])
}

import { Jsonify } from "type-fest"
import { z } from "zod"

import { zObjectId } from "./common"

export const ZMailing = z
  .object({
    campaign: z.string(),
    message_id: z.string(),
    status: z.string(),
    webhook_status_at: z.date(),
    email_sent_at: z.date(),
  })
  .strict()

export const ZAppointment = z
  .object({
    _id: zObjectId,
    applicant_id: z.string().nullish(),
    cfa_intention_to_applicant: z.string().nullish(),
    cfa_message_to_applicant_date: z.date().nullish(),
    cfa_message_to_applicant: z.string().nullish(),
    applicant_message_to_cfa: z.string().nullish(),
    applicant_reasons: z.array(z.enum(["modalite", "contenu", "porte", "frais", "place", "horaire", "plus", "accompagnement", "lieu", "suivi", "autre"])).nullish(),
    cfa_gestionnaire_siret: z.string().nullish(),
    cfa_formateur_siret: z.string().nullish(),
    appointment_origin: z.string().nullish(),
    cfa_read_appointment_details_date: z.date().nullish(),
    to_applicant_mails: z.array(ZMailing).nullish(),
    to_cfa_mails: z.array(ZMailing).nullish(),
    cle_ministere_educatif: z.string().nullish(),
    created_at: z.date().default(() => new Date()),
    cfa_recipient_email: z.string().nullish(),
    is_anonymized: z.boolean().default(false),
  })
  .strict()

export type IAppointment = z.output<typeof ZAppointment>
export type IAppointmentJson = Jsonify<z.input<typeof ZAppointment>>

export type IMailing = z.output<typeof ZMailing>
export type EReason = NonNullable<IAppointment["applicant_reasons"]>[0]

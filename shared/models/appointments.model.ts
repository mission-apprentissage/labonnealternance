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
    applicant_id: z.string().nullable(),
    cfa_intention_to_applicant: z.string().nullable(),
    cfa_message_to_applicant_date: z.date().nullable(),
    cfa_message_to_applicant: z.string().nullable(),
    applicant_message_to_cfa: z.string().nullable(),
    applicant_reasons: z.array(z.string()).nullable(),
    cfa_gestionnaire_siret: z.string().nullable(),
    cfa_formateur_siret: z.string().nullable(),
    appointment_origin: z.string().nullable(),
    cfa_read_appointment_details_date: z.date().nullable(),
    to_applicant_mails: z.array(ZMailing).nullable(),
    to_cfa_mails: z.array(ZMailing).nullable(),
    cle_ministere_educatif: z.string().nullable(),
    created_at: z.date().default(() => new Date()),
    cfa_recipient_email: z.string().nullable(),
    is_anonymized: z.boolean().default(false),
  })
  .strict()

export type IAppointment = z.output<typeof ZAppointment>
export type IAppointmentJson = Jsonify<z.input<typeof ZAppointment>>

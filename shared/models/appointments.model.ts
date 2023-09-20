import { Jsonify } from "type-fest"
import { z } from "zod"

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
    applicant_id: z.string(),
    applicant_message_to_cfa: z.string(),
    applicant_reasons: z.enum(["modalite", "contenu", "porte", "frais", "place", "horaire", "plus", "accompagnement", "lieu", "suivi", "autre"]),
    cfa_formateur_siret: z.string(),
    appointment_origin: z.string(),
    cfa_read_appointment_details_date: z.date(),
    to_applicant_mails: z.array(ZMailing),
    to_cfa_mails: z.array(ZMailing),
    cle_ministere_educatif: z.string(),
    created_at: z.date(),
    last_update_at: z.date(),
    email_cfa: z.string(),
    is_anonymized: z.boolean(),
    cfa_recipient_email: z.string(),
  })
  .strict()

export type IAppointment = z.output<typeof ZAppointment>
export type IAppointmentJson = Jsonify<z.input<typeof ZAppointment>>

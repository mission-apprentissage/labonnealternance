import { Jsonify } from "type-fest"

import { AppointmentUserType } from "../constants/appointment"
import { z } from "../helpers/zodWithOpenApi"

import { zObjectId } from "./common"
import { enumToZod } from "./enumToZod"

export const enum EReasonsKey {
  MODALITE = "modalite",
  CONTENU = "contenu",
  PORTE = "porte",
  FRAIS = "frais",
  PLACE = "place",
  HORAIRE = "horaire",
  PLUS = "plus",
  ACCOMPAGNEMENT = "accompagnement",
  LIEU = "lieu",
  SUIVI = "suivi",
  AUTRE = "autre",
}

export const ZMailing = z
  .object({
    campaign: z.string(),
    message_id: z.string(),
    status: z.string().nullish(),
    webhook_status_at: z.date().nullish(),
    email_sent_at: z.date().nullish(),
  })
  .strict()
  .openapi("Mailing")

export const ZAppointment = z
  .object({
    _id: zObjectId,
    applicant_id: z.string(),
    cfa_intention_to_applicant: z.string().nullish(),
    cfa_message_to_applicant_date: z.date().nullish(),
    cfa_message_to_applicant: z.string().nullish(),
    applicant_message_to_cfa: z.string().nullish(),
    applicant_reasons: z.array(z.enum(["modalite", "contenu", "porte", "frais", "place", "horaire", "plus", "accompagnement", "lieu", "suivi", "autre"])).nullish(),
    cfa_gestionnaire_siret: z.string().nullish(),
    cfa_formateur_siret: z.string().nullish(),
    appointment_origin: z.string(),
    cfa_read_appointment_details_date: z.date().nullish(),
    to_applicant_mails: z.array(ZMailing).nullable(),
    to_cfa_mails: z.array(ZMailing),
    cle_ministere_educatif: z.string(),
    created_at: z.date().default(() => new Date()),
    cfa_recipient_email: z.string(),
    applicant_type: enumToZod(AppointmentUserType).nullish(),
  })
  .strict()
  .openapi("Appointment")

export type IAppointment = z.output<typeof ZAppointment>
export type IAppointmentJson = Jsonify<z.input<typeof ZAppointment>>

export type IMailing = z.output<typeof ZMailing>
export type EReason = NonNullable<IAppointment["applicant_reasons"]>[0]

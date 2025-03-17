import { Jsonify } from "type-fest"

import { AppointmentUserType } from "../constants/appointment.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"

const collectionName = "appointments" as const

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
  DEBOUCHE = "debouche",
}

export const EREASONS = Object.values(["modalite", "contenu", "porte", "frais", "place", "horaire", "plus", "accompagnement", "lieu", "suivi", "autre", "debouche"])
export type EReason = NonNullable<IAppointment["applicant_reasons"]>[0]

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

export type IMailing = z.output<typeof ZMailing>

export const ZAppointment = z
  .object({
    _id: zObjectId,
    applicant_id: zObjectId,
    cfa_intention_to_applicant: z.string().nullish(),
    cfa_message_to_applicant_date: z.date().nullish(),
    cfa_message_to_applicant: z.string().nullish(),
    applicant_message_to_cfa: z.string().nullish(),
    applicant_reasons: z.array(z.enum([EREASONS[0], ...EREASONS.slice(1)])).nullish(),
    cfa_gestionnaire_siret: z.string().nullish(),
    cfa_formateur_siret: z.string().nullish(),
    appointment_origin: z.string(),
    cfa_read_appointment_details_date: z.date().nullish(),
    to_applicant_mails: z.array(ZMailing).nullish(),
    to_cfa_mails: z.array(ZMailing).nullish(),
    cle_ministere_educatif: z.string(),
    created_at: z.date().default(() => new Date()),
    cfa_recipient_email: z.string(),
    applicant_type: extensions.buildEnum(AppointmentUserType).nullish(),
  })
  .strict()
  .openapi("Appointment")

export type IAppointment = z.output<typeof ZAppointment>
export type IAppointmentJson = Jsonify<z.input<typeof ZAppointment>>

export default {
  zod: ZAppointment,
  indexes: [
    [{ applicant_id: 1 }, {}],
    [{ "to_applicant_mails.message_id": 1 }, {}],
    [{ "to_cfa_mails.message_id": 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

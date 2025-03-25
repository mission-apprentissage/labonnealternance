import { Jsonify } from "type-fest"

import { AppointmentUserType } from "../constants/appointment.js"
import { extensions } from "../helpers/zodHelpers/zodPrimitives.js"
import { z } from "../helpers/zodWithOpenApi.js"

import { IModelDescriptor, zObjectId } from "./common.js"
import { ZEtablissement } from "./etablissement.model.js"

const collectionName = "appointments" as const

export enum EReasonsKey {
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

export const ZAppointmentShortRecap = z.object({
  user: z.object({
    firstname: z.string(),
    lastname: z.string(),
    phone: z.string(),
    email: z.string(),
  }),
  formation: z.object({
    etablissement_formateur_raison_sociale: z.string().nullish(),
    lieu_formation_email: z.string().nullish(),
  }),
})
export type IAppointmentShortRecap = z.output<typeof ZAppointmentShortRecap>
export type IAppointmentShortRecapJson = Jsonify<z.output<typeof ZAppointmentShortRecap>>

export const ZAppointmentRecap = z.object({
  appointment: z.object({
    _id: ZAppointment.shape._id,
    cfa_intention_to_applicant: ZAppointment.shape.cfa_intention_to_applicant,
    cfa_message_to_applicant_date: ZAppointment.shape.cfa_message_to_applicant_date,
    cfa_message_to_applicant: ZAppointment.shape.cfa_message_to_applicant,
    applicant_message_to_cfa: ZAppointment.shape.applicant_message_to_cfa,
    applicant_reasons: ZAppointment.shape.applicant_reasons,
    cle_ministere_educatif: ZAppointment.shape.cle_ministere_educatif,
    applicant_id: ZAppointment.shape.applicant_id,
    cfa_read_appointment_details_date: ZAppointment.shape.cfa_read_appointment_details_date,
  }),
  user: z.object({
    _id: zObjectId,
    firstname: z.string(),
    lastname: z.string(),
    phone: z.string(),
    email: z.string(),
    type: z.string(),
  }),
  formation: z.union([
    z.object({
      _id: ZEtablissement.shape._id,
      training_intitule_long: z.string().nullish(),
      etablissement_formateur_raison_sociale: z.string().nullish(),
      lieu_formation_street: z.string().nullish(),
      lieu_formation_city: z.string().nullish(),
      lieu_formation_zip_code: z.string().nullish(),
      lieu_formation_email: z.string().nullish(),
    }),
    z.null(),
  ]),
})

export type IAppointmentRecap = z.output<typeof ZAppointmentRecap>
export type IAppointmentRecapJson = Jsonify<z.output<typeof ZAppointmentRecap>>

export default {
  zod: ZAppointment,
  indexes: [
    [{ applicant_id: 1 }, {}],
    [{ "to_applicant_mails.message_id": 1 }, {}],
    [{ "to_cfa_mails.message_id": 1 }, {}],
  ],
  collectionName,
} as const satisfies IModelDescriptor

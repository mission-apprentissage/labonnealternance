import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "../../../mongodb.js"
import { IAppointments } from "./appointments.types.js"

export const appointmentSchema = new Schema<IAppointments>({
  applicant_id: {
    type: String,
    default: null,
    description: "Id candidat",
  },
  cfa_intention_to_applicant: {
    type: String,
    default: null,
    description: "Type de réponse du CFA à la demande de RDV (personalised_answer/other_channel/no_answer)",
  },
  cfa_message_to_applicant_date: {
    type: Date,
    default: null,
    description: "Date d'envoi de la réponse du CFA à la demande de RDV",
  },
  cfa_message_to_applicant: {
    type: String,
    default: null,
    description: "Message de réponse du CFA à la demande de RDV",
  },
  applicant_message_to_cfa: {
    type: String,
    default: null,
    required: false,
    description: "Les motivations du candidat",
  },
  applicant_reasons: {
    type: "array",
    default: null,
    required: false,
    description: "Les raisons qui poussent le candidat à écrire",
  },
  cfa_gestionnaire_siret: {
    type: String,
    default: null,
    description: "SIRET gestionnaire",
  },
  cfa_formateur_siret: {
    type: String,
    default: null,
    description: "SIRET formateur",
  },
  appointment_origin: {
    type: String,
    default: null,
    description: "Le nom du site parent",
  },
  cfa_read_appointment_details_date: {
    type: Date,
    default: null,
    description: "Date à laquelle le CFA à consulté la page contenant les informations du rendez et du candidat",
  },
  to_applicant_mails: {
    type: "array",
    description: "Liste des évènements MAIL récupéré par le serveur",
    required: false,
    items: {
      type: "object",
      required: false,
      properties: {
        campaign: {
          type: "string",
          default: null,
          description: "Identifiant de campagne",
        },
        message_id: {
          type: "string",
          default: null,
          description: "Identifiant Brevo",
        },
        status: {
          type: "string",
          default: null,
          description: "Code erreur Brevo",
        },
        webhook_status_at: {
          type: Date,
          default: null,
          description: "Date fournie par les webhooks Brevo lors de la réception d'un event",
        },
        email_sent_at: {
          type: Date,
          default: null,
          description: "Date de création de la collection",
        },
      },
    },
  },
  to_cfa_mails: {
    type: "array",
    description: "Liste des évènements MAIL récupéré par le serveur",
    required: false,
    items: {
      type: "object",
      required: false,
      properties: {
        campaign: {
          type: "string",
          default: null,
          description: "Identifiant de campagne",
        },
        message_id: {
          type: "string",
          default: null,
          description: "Identifiant Brevo",
        },
        status: {
          type: "string",
          default: null,
          description: "Code erreur Brevo",
        },
        webhook_status_at: {
          type: Date,
          default: null,
          description: "Date fournie par les webhooks Brevo lors de la réception d'un event",
        },
        email_sent_at: {
          type: Date,
          default: null,
          description: "Date de création de la collection",
        },
      },
    },
  },
  cle_ministere_educatif: {
    type: String,
    default: null,
    description: "Identifiant unique d'une formation",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "La date création de la demande",
  },
  cfa_recipient_email: {
    type: String,
    required: false,
    default: null,
    description: "Adresse email CFA",
  },
  is_anonymized: {
    type: Boolean,
    default: false,
    description: "Si l'enregistrement est anonymisé",
  },
})

appointmentSchema.plugin(mongoosePagination)

export default model<IAppointments, Pagination<IAppointments>>("appointment", appointmentSchema)

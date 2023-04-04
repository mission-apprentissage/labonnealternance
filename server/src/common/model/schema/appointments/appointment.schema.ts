import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "../../../mongodb.js"
import { IAppointments } from "./appointments.types.js"

export const appointmentSchema = new Schema<IAppointments>({
  applicant_id: {
    type: String,
    default: null,
    description: "Id candidat",
  },
  applicant_message_to_cfa: {
    type: String,
    default: null,
    required: false,
    description: "Les motivations du candidat",
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
          description: "Identifiant Sendinblue",
        },
        status: {
          type: "string",
          default: null,
          description: "Code erreur Sendinblue",
        },
        webhook_status_at: {
          type: Date,
          default: null,
          description: "Date fournie par les webhooks Sendinblue lors de la réception d'un event",
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
          description: "Identifiant Sendinblue",
        },
        status: {
          type: "string",
          default: null,
          description: "Code erreur Sendinblue",
        },
        webhook_status_at: {
          type: Date,
          default: null,
          description: "Date fournie par les webhooks Sendinblue lors de la réception d'un event",
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

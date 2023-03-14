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
  admin_comment: {
    type: String,
    default: null,
    description: "Champs libre qui sert de notes supplémentaires",
  },
  cfa_callback_intention_date: {
    type: Date,
    default: null,
    description: "La date de la première prise de contact du cfa vers le candidat",
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
  email_premiere_demande_cfa_message_id: {
    type: String,
    default: null,
    description: "Identifiant externe du mail envoyé au CFA",
  },
  rco_formation_id: {
    type: String,
    default: null,
    description: "Id RCO formation",
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
  last_update_at: {
    type: Date,
    default: Date.now,
    description: "Date de dernières mise à jour",
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

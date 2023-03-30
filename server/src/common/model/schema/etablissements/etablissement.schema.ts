import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "../../../mongodb.js"
import { IEtablissement } from "./etablissement.types.js"

export const etablissementSchema = new Schema<IEtablissement>({
  formateur_siret: {
    type: String,
    default: null,
    description: "Siret formateur",
  },
  gestionnaire_siret: {
    type: String,
    default: null,
    description: "Siret gestionnaire",
  },
  raison_sociale: {
    type: String,
    default: null,
    description: "Raison sociale",
  },
  address: {
    type: String,
    default: null,
    description: "Adresse",
  },
  zip_code: {
    type: String,
    default: null,
    description: "Code postal",
  },
  city: {
    type: String,
    default: null,
    description: "Localité",
  },
  gestionnaire_email: {
    type: String,
    default: null,
    description: "Email du decisionnaire de l'établissement",
  },
  premium_invitation_date: {
    type: Date,
    default: null,
    description: "Date d'invitation au Premium (Publication sur Parcoursup)",
  },
  premium_activation_date: {
    type: Date,
    default: null,
    description: "Date d'acceptation de l'offre Premium",
  },
  premium_refusal_date: {
    type: Date,
    default: null,
    description: "Date de refus de l'offre Premium",
  },
  optout_invitation_date: {
    type: Date,
    default: null,
    description: "Date d'invitation de l'opt-out",
  },
  optout_activation_scheduled_date: {
    type: Date,
    default: null,
    description: "Date à laquelle l'activation sera effective",
  },
  optout_activation_date: {
    type: Date,
    default: null,
    description: "Date d'activation de l'opt-out",
  },
  optout_refusal_date: {
    type: Date,
    default: null,
    description: "Date de refus de l'opt-out",
  },
  to_etablissement_emails: {
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
  last_catalogue_sync_date: {
    type: Date,
    default: null,
    description: "Date de la dernière synchronisation avec le Catalogue",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date de création de la collection",
  },
})

etablissementSchema.plugin(mongoosePagination)

export default model<IEtablissement, Pagination<IEtablissement>>("etablissement", etablissementSchema)

import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "../../../mongodb.js"
import { optMode } from "../../constants/etablissement.js"
import { IEtablissement } from "./etablissement.types.js"

export const etablissementSchema = new Schema<IEtablissement>({
  siret_formateur: {
    type: String,
    default: null,
    description: "Siret formateur",
  },
  siret_gestionnaire: {
    type: String,
    default: null,
    description: "Siret gestionnaire",
  },
  raison_sociale: {
    type: String,
    default: null,
    description: "Raison sociale",
  },
  adresse: {
    type: String,
    default: null,
    description: "Adresse",
  },
  code_postal: {
    type: String,
    default: null,
    description: "Code postal",
  },
  localite: {
    type: String,
    default: null,
    description: "Localité",
  },
  email_decisionnaire: {
    type: String,
    default: null,
    description: "Email du decisionnaire de l'établissement",
  },
  etablissement_formateur_courriel: {
    type: String,
    default: null,
    description: "Email du formateur",
  },
  premium_invited_at: {
    type: Date,
    default: null,
    description: "Date d'invitation au Premium (Publication sur Parcoursup)",
  },
  premium_activated_at: {
    type: Date,
    default: null,
    description: "Date d'acceptation de l'offre Premium",
  },
  premium_refused_at: {
    type: Date,
    default: null,
    description: "Date de refus de l'offre Premium",
  },
  premium_affelnet_invitation_date: {
    type: Date,
    default: null,
    description: "Date d'invitation au Premium (Affelnet)",
  },
  premium_affelnet_activation_date: {
    type: Date,
    default: null,
    description: "Date d'acceptation au Premium (Affelnet)",
  },
  premium_affelnet_refusal_date: {
    type: Date,
    default: null,
    description: "Date de refus au Premium (Affelnet)",
  },
  optout_invitation_date: {
    type: Date,
    default: null,
    description: "Date d'invitation de l'opt-out",
  },
  opt_out_will_be_activated_at: {
    type: Date,
    default: null,
    description: "Date à laquelle l'activation sera effective",
  },
  opt_out_activated_at: {
    type: Date,
    default: null,
    description: "Date d'activation de l'opt-out",
  },
  opt_out_refused_at: {
    type: Date,
    default: null,
    description: "Date de refus de l'opt-out",
  },
  opt_out_question: {
    type: String,
    default: null,
    description: "Question du décisionnaire quand il se rends sur le formulaire de désinscript à l'opt-out",
  },
  mailing: {
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
  last_catalogue_sync: {
    type: Date,
    default: null,
    description: "Date de la dernière synchronisation avec le Catalogue",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date de création de la collection",
  },
  affelnet_perimetre: {
    type: Boolean,
    description: "L'établissement a été traité par la synchronisation Affelnet",
  },
})

etablissementSchema.plugin(mongoosePagination)

export default model<IEtablissement, Pagination<IEtablissement>>("etablissement", etablissementSchema)

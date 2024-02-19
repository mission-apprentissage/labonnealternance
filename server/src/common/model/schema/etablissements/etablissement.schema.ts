import { IEtablissement } from "shared"

import { model, Schema } from "../../../mongodb"
import { mongoosePagination, Pagination } from "../_shared/mongoose-paginate"

export const etablissementSchema = new Schema<IEtablissement>(
  {
    formateur_siret: {
      type: String,
      default: null,
      description: "Siret formateur",
    },
    gestionnaire_siret: {
      type: String,
      index: true,
      default: null,
      description: "Siret gestionnaire",
    },
    raison_sociale: {
      type: String,
      default: null,
      description: "Raison sociale",
    },
    formateur_address: {
      type: String,
      default: null,
      description: "Adresse formateur",
    },
    formateur_zip_code: {
      type: String,
      default: null,
      description: "Code postal formateur",
    },
    formateur_city: {
      type: String,
      default: null,
      description: "Ville formateur",
    },
    gestionnaire_email: {
      type: String,
      default: null,
      description: "Email du decisionnaire de l'établissement",
    },
    premium_invitation_date: {
      type: Date,
      default: null,
      description: "Date d'invitation au Premium (Parcoursup)",
    },
    premium_activation_date: {
      type: Date,
      index: true,
      default: null,
      description: "Date d'acceptation de l'offre Premium (Parcoursup)",
    },
    premium_refusal_date: {
      type: Date,
      default: null,
      description: "Date de refus de l'offre Premium (Parcoursup)",
    },
    premium_follow_up_date: {
      type: Date,
      default: null,
      description: "Date de relance de l'offre Premium (Parcoursup)",
    },
    premium_affelnet_invitation_date: {
      type: Date,
      default: null,
      description: "Date d'invitation au Premium (Affelnet)",
    },
    premium_affelnet_activation_date: {
      type: Date,
      index: true,
      default: null,
      description: "Date d'acceptation au Premium (Affelnet)",
    },
    premium_affelnet_refusal_date: {
      type: Date,
      default: null,
      description: "Date de refus au Premium (Affelnet)",
    },
    premium_affelnet_follow_up_date: {
      type: Date,
      default: null,
      description: "Date de relance au Premium (Affelnet)",
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
      index: true,
      default: null,
      description: "Date d'activation de l'opt-out",
    },
    optout_refusal_date: {
      type: Date,
      default: null,
      description: "Date de refus de l'opt-out",
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
    affelnet_perimetre: {
      type: Boolean,
      description: "L'établissement a été traité par la synchronisation Affelnet",
    },
  },
  {
    versionKey: false,
  }
)

etablissementSchema.plugin(mongoosePagination)

export default model<IEtablissement, Pagination<IEtablissement>>("etablissement", etablissementSchema)

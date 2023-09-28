import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { IEligibleTrainingsForAppointment } from "shared"

import { model, Schema } from "../../../mongodb"

export const eligibleTrainingsForAppointmentSchema = new Schema<IEligibleTrainingsForAppointment>(
  {
    training_id_catalogue: {
      type: String,
      require: true,
      description: "Identifiant d'une formation Catalogue",
    },
    training_intitule_long: {
      type: String,
      require: true,
      description: "Intitulé long de la formation autorisée",
    },
    etablissement_formateur_zip_code: {
      type: String,
      require: true,
      description: "Code postal du lieu de formation",
    },
    training_code_formation_diplome: {
      type: String,
      require: true,
      description: "CFD de la formation autorisée",
    },
    lieu_formation_email: {
      type: String,
      default: null,
      description: "Adresse email pour la prise de RDV",
    },
    is_lieu_formation_email_customized: {
      type: Boolean,
      default: null,
      description: "Spécifie si la synchronisation avec le catalogue ne doit pas écraser l'email_rdv",
    },
    referrers: {
      type: [String],
      default: [],
      description: "Liste des sites autorisés",
    },
    rco_formation_id: {
      type: String,
      default: null,
      description: "Id RCO formation",
    },
    is_catalogue_published: {
      type: Boolean,
      require: true,
      description: "Si la formation est publiée sur le Catalogue",
    },
    last_catalogue_sync_date: {
      type: Date,
      default: Date.now,
      description: "Date de la dernière synchronisation avec le Catalogue",
    },
    parcoursup_id: {
      type: String,
      default: null,
      description: "Identifiant Parcoursup",
    },
    cle_ministere_educatif: {
      type: String,
      require: true,
      description: "Identifiant unique d'une formation",
      index: true,
    },
    etablissement_formateur_raison_sociale: {
      type: String,
      require: true,
      description: "Raison sociale de l'établissement",
    },
    etablissement_formateur_street: {
      type: String,
      require: true,
      description: "Adresse de l'établissement formateur",
    },
    departement_etablissement_formateur: {
      type: String,
      require: true,
      description: "Département de l'établissement formateur",
    },
    etablissement_formateur_city: {
      type: String,
      require: true,
      description: "Localité de l'établissement formateur",
    },
    lieu_formation_street: {
      type: String,
      require: true,
      description: "Adresse du lieux de formation",
    },
    lieu_formation_city: {
      type: String,
      require: true,
      description: "Localité de la formation",
    },
    lieu_formation_zip_code: {
      type: String,
      require: true,
      description: "Localité de la formation code postal",
    },
    etablissement_formateur_siret: {
      type: String,
      require: true,
      description: "Siret formateur",
    },
    etablissement_gestionnaire_siret: {
      type: String,
      require: true,
      description: "Siret gestionnaire",
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "Date de création du document",
    },
    historization_date: {
      type: Date,
      default: null,
      description: "Date d'historisation",
    },
  },
  {
    versionKey: false,
  }
)

eligibleTrainingsForAppointmentSchema.plugin(mongoosePagination)

export default model<IEligibleTrainingsForAppointment, Pagination<IEligibleTrainingsForAppointment>>("eligible_trainings_for_appointments", eligibleTrainingsForAppointmentSchema)

import { mongoosePagination, Pagination } from "mongoose-paginate-ts"
import { model, Schema } from "../../../mongodb.js"
import { IEligibleTrainingsForAppointment } from "./eligibleTrainingsForAppointment.types.js"

export const eligibleTrainingsForAppointmentSchema = new Schema<IEligibleTrainingsForAppointment>({
  training_id_catalogue: {
    type: String,
    default: null,
    description: "Identifiant d'une formation Catalogue",
  },
  etablissement_siret: {
    type: String,
    default: null,
    description: "Siret formateur",
  },
  training_intitule_long: {
    type: String,
    default: null,
    description: "Intitulé long de la formation autorisée",
  },
  etablissement_formateur_zip_code: {
    type: String,
    default: null,
    description: "Code postal du lieu de formation",
  },
  training_code_formation_diplome: {
    type: String,
    default: null,
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
    type: [Object],
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
    default: null,
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
    default: null,
    description: "Identifiant unique d'une formation",
  },
  etablissement_formateur_raison_sociale: {
    type: String,
    default: null,
    description: "Raison sociale de l'établissement",
  },
  etablissement_formateur_street: {
    type: String,
    default: null,
    description: "Adresse de l'établissement formateur",
  },
  departement_etablissement_formateur: {
    type: String,
    default: null,
    description: "Département de l'établissement formateur",
  },
  etablissement_formateur_city: {
    type: String,
    default: null,
    description: "Localité de l'établissement formateur",
  },
  lieu_formation_street: {
    type: String,
    default: null,
    description: "Adresse du lieux de formation",
  },
  etablissement_formateur_siret: {
    type: String,
    default: null,
    description: "Siret formateur",
  },
  etablissement_gestionnaire_siret: {
    type: String,
    default: null,
    description: "Siret gestionnaire",
  },
  city: {
    type: String,
    default: null,
    description: "Localité de la formation",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date de création du document",
  },
  historization_date: {
    type: Date,
    description: "Date d'historisation",
  },
})

eligibleTrainingsForAppointmentSchema.plugin(mongoosePagination)

export default model<IEligibleTrainingsForAppointment, Pagination<IEligibleTrainingsForAppointment>>("eligible_trainings_for_appointments", eligibleTrainingsForAppointmentSchema)

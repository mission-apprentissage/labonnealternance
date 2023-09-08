import { VALIDATION_UTILISATEUR } from "../../../../services/constant.service.js"
import { Schema } from "../../../mongodb.js"
import { buildMongooseModel } from "./buildMongooseModel.js"
import { Entreprise, EntrepriseStatusEvent, EntrepriseStatusEventType } from "./entreprise.types.js"

const validationSchema = new Schema<EntrepriseStatusEvent>(
  {
    validation_type: {
      type: String,
      enum: Object.values(VALIDATION_UTILISATEUR),
      description: "Indique si l'événement est déclenché de manière automatique ou par un utilisateur",
    },
    status: {
      type: String,
      enum: Object.values(EntrepriseStatusEventType),
      description: "nouveau status",
    },
    reason: {
      type: String,
      description: "Raison du changement de statut",
    },
    granted_by: {
      type: String,
      description: "Utilisateur ayant effectué la modification | SERVEUR si le compte a été validé automatiquement",
    },
    date: {
      type: Date,
      default: () => new Date(),
      description: "Date de l'évènement",
    },
  },
  { _id: false }
)

const entrepriseSchema = new Schema<Entreprise>(
  {
    establishment_siret: {
      type: String,
      description: "Siret de l'établissement",
    },
    opco: {
      type: String,
      default: null,
      description: "Information sur l'opco de l'entreprise",
    },
    idcc: {
      type: String,
      description: "Identifiant convention collective de l'entreprise",
    },
    establishment_raison_sociale: {
      type: String,
      description: "Raison social de l'établissement",
    },
    establishment_enseigne: {
      type: String,
      default: null,
      description: "Enseigne de l'établissement",
    },
    address_detail: {
      type: Object,
      description: "Detail de l'adresse de l'établissement",
    },
    address: {
      type: String,
      description: "Adresse de l'établissement",
    },
    geo_coordinates: {
      type: String,
      default: null,
      description: "Latitude/Longitude de l'adresse de l'entreprise",
    },
    establishment_id: {
      type: String,
      description: "Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique",
    },
    origin: {
      type: String,
      description: "Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi",
    },
    history: {
      type: [validationSchema],
      description: "Tableau des modifications de statut de l'utilisateur",
    },
  },
  {
    timestamps: true,
  }
)

export const entrepriseRepository = buildMongooseModel(entrepriseSchema, "entreprise")

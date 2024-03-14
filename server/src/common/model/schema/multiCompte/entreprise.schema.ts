import { VALIDATION_UTILISATEUR } from "shared/constants/recruteur.js"
import { EntrepriseStatus, IEntreprise, IEntrepriseStatusEvent } from "shared/models/entreprise.model.js"

import { Schema } from "../../../mongodb.js"

import { buildMongooseModel } from "./buildMongooseModel.js"

const statusEventSchema = new Schema<IEntrepriseStatusEvent>(
  {
    validation_type: {
      type: String,
      enum: Object.values(VALIDATION_UTILISATEUR),
      description: "Indique si l'action est ordonnée par un utilisateur ou le serveur",
    },
    status: {
      type: String,
      enum: Object.values(EntrepriseStatus),
      description: "Statut",
      index: true,
    },
    reason: {
      type: String,
      description: "Raison du changement de statut",
    },
    granted_by: {
      type: String,
      default: null,
      description: "Utilisateur à l'origine du changement",
    },
    date: {
      type: Date,
      default: () => new Date(),
      description: "Date de l'évènement",
    },
  },
  { _id: false }
)

const entrepriseSchema = new Schema<IEntreprise>(
  {
    status: {
      type: [statusEventSchema],
      description: "Evénements liés au cycle de vie",
    },
    origin: {
      type: String,
      description: "Origine de la creation de l'utilisateur (ex: Campagne mail, lien web, etc...) pour suivi",
    },
    siret: {
      type: String,
      description: "Siret de l'établissement",
    },
    raison_sociale: {
      type: String,
      description: "Raison social de l'établissement",
    },
    enseigne: {
      type: String,
      default: null,
      description: "Enseigne de l'établissement",
    },
    idcc: {
      type: String,
      description: "Identifiant convention collective de l'entreprise",
    },
    address: {
      type: String,
      description: "Adresse de l'établissement",
    },
    address_detail: {
      type: Object,
      description: "Detail de l'adresse de l'établissement",
    },
    geo_coordinates: {
      type: String,
      default: null,
      description: "Latitude/Longitude de l'adresse de l'entreprise",
    },
    opco: {
      type: String,
      default: null,
      description: "Information sur l'opco de l'entreprise",
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Entreprise = buildMongooseModel(entrepriseSchema, "entreprise")

import { IEntreprise } from "shared/models/entreprise.model.js"

import { Schema } from "../../../mongodb.js"

import { buildMongooseModel } from "./buildMongooseModel.js"

const entrepriseSchema = new Schema<IEntreprise>(
  {
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
    establishment_id: {
      type: String,
      description: "Si l'utilisateur est une entreprise, l'objet doit contenir un identifiant de formulaire unique",
    },
  },
  {
    timestamps: true,
  }
)

export const Entreprise = buildMongooseModel(entrepriseSchema, "entreprise")

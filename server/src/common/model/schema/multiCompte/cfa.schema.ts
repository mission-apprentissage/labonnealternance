import { ICFA } from "shared/models/cfa.model.js"

import { Schema } from "../../../mongodb.js"

import { buildMongooseModel } from "./buildMongooseModel.js"

const cfaSchema = new Schema<ICFA>(
  {
    origin: {
      type: String,
      description: "Origine de la creation (ex: Campagne mail, lien web, etc...) pour suivi",
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
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

export const Cfa = buildMongooseModel(cfaSchema, "cfa")

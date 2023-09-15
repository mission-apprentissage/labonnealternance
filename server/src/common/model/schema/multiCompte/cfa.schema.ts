import { Schema } from "../../../mongodb.js"
import { buildMongooseModel } from "./buildMongooseModel.js"
import { CFA } from "./cfa.types.js"

const cfaSchema = new Schema<CFA>(
  {
    establishment_siret: {
      type: String,
      description: "Siret de l'établissement",
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
    origin: {
      type: String,
      description: "Origine de la creation (ex: Campagne mail, lien web, etc...) pour suivi",
    },
  },
  {
    timestamps: true,
  }
)

export const cfaRepository = buildMongooseModel(cfaSchema, "cfa")

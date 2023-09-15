import { Schema } from "../../../mongodb.js"
import { buildMongooseModel } from "./buildMongooseModel.js"
import { Entreprise } from "./entreprise.types.js"

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
  },
  {
    timestamps: true,
  }
)

export const entrepriseRepository = buildMongooseModel(entrepriseSchema, "entreprise")

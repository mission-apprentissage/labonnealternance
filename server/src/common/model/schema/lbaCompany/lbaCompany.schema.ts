import { ILbaCompany } from "shared"

import { Schema, model } from "../../../mongodb"
import { geoPointSchema } from "../geopoint/geoPoint.schema"

export const lbaCompanySchema = new Schema<ILbaCompany>(
  {
    siret: {
      type: String,
      require: true,
      description: "Le Siret de la société",
      index: true,
    },
    recruitment_potential: {
      type: Number,
      default: 0,
      description: "Le score de recrutement de la société",
    },
    raison_sociale: {
      type: String,
      default: null,
      description: "Raison sociale de l'entreprise",
    },
    enseigne: {
      type: String,
      require: true,
      description: "Enseigne de l'entreprise",
    },
    naf_code: {
      type: String,
      default: null,
      description: "Code NAF de l'entreprise",
    },
    naf_label: {
      type: String,
      default: null,
      description: "Intitulé du code NAF",
    },
    rome_codes: {
      type: [String],
      default: [],
      description: "Liste des codes ROMEs au sein de l'entreprise",
      index: true,
    },
    street_number: {
      type: String,
      default: null,
      description: "Numéro dans la rue",
    },
    street_name: {
      type: String,
      default: null,
      description: "Nom de la rue",
    },
    insee_city_code: {
      type: String,
      default: null,
      description: "Code commune INSEE",
    },
    zip_code: {
      type: String,
      default: null,
      description: "Code postal",
    },
    city: {
      type: String,
      default: null,
      description: "Ville",
    },
    geo_coordinates: {
      type: String,
      implicit_type: "geo_point",
      description: "Latitude et longitude de l'établissement",
    },
    geopoint: {
      type: geoPointSchema,
      default: null,
      description: "La géolocation du lieu sous forme de geoPoint",
    },
    email: {
      type: String,
      default: null,
      description: "Adresse email de contact",
    },
    phone: {
      type: String,
      default: null,
      description: "Numéro de téléphone de contact",
    },
    company_size: { type: String, default: null, description: "Tranche effectif de l'entreprise" },
    website: {
      type: String,
      default: null,
      description: "URL du site Internet",
    },
    opco: {
      type: String,
      default: null,
      description: "L'OPCO de la société",
      index: true,
    },
    opco_short_name: {
      type: String,
      default: null,
      index: true,
      description: "Nom court de l'opco",
    },
    opco_url: {
      type: String,
      default: null,
      description: "L'URL spécifique liée à l'OPCO de la société",
      index: true,
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "La date création de la demande",
    },
    last_update_at: {
      type: Date,
      default: Date.now,
      description: "Date de dernières mise à jour",
    },
  },
  {
    versionKey: false,
  }
)

export default model<ILbaCompany>("bonnesboites", lbaCompanySchema)

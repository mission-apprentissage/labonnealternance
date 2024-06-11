import { IOpco } from "shared/models/opco.model"

import { model, Schema } from "../../../mongodb"

export const opcoSchema = new Schema<IOpco>(
  {
    siren: {
      type: String,
      require: true,
      description: "Le SIREN d'un ",
      index: true,
      unique: true,
    },
    opco: {
      type: String,
      require: true,
      index: true,
      description: "Nom de l'opco",
    },
    opco_short_name: {
      type: String,
      default: null,
      index: true,
      description: "Nom court de de l'opco servant de clef dans notre table de constantes",
    },
    idcc: {
      type: String,
      default: null,
      index: true,
      description: "Identifiant convention collective",
    },
    url: {
      type: String,
      default: null,
      index: true,
      description: "Site internet de l'opco",
    },
  },
  {
    versionKey: false,
  }
)

export default model<IOpco>("opco", opcoSchema)

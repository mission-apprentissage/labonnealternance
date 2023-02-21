import { model, Schema } from "../../../mongodb.js"
import { IOpco } from "./opco.types.js"

export const opcoSchema = new Schema<IOpco>({
  siren: {
    type: String,
    default: null,
    description: "Le SIREN d'un ",
    index: true,
    unique: true,
  },
  opco: {
    type: String,
    default: null,
    index: true,
    description: "Nom de l'opco",
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
})

export default model<IOpco>("opco", opcoSchema)

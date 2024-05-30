import { ILbaCompanyUpdateEvent } from "shared"

import { Schema, model } from "../../../mongodb"

export const lbaCompanyUpdateEventSchema = new Schema<ILbaCompanyUpdateEvent>(
  {
    siret: {
      type: String,
      require: true,
      description: "Le Siret de la société",
      index: true,
    },
    event: {
      type: String,
      description: "Le type de modification effectué",
    },
    value: {
      type: String,
      default: "",
      description: "La nouvelle valeur",
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "La date création de la demande",
    },
  },
  {
    versionKey: false,
  }
)

export default model<ILbaCompanyUpdateEvent>("lbacompanyupdateevents", lbaCompanyUpdateEventSchema)

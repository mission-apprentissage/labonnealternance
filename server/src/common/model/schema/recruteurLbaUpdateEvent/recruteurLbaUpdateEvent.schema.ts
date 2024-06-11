import type { IRecruteurLbaUpdateEvent } from "shared"

import { Schema, model } from "../../../mongodb"

export const recruteurLbaUpdateEventSchema = new Schema<IRecruteurLbaUpdateEvent>(
  {
    siret: {
      type: String,
      require: true,
      description: "Le Siret de la société",
    },
    event: {
      type: String,
      require: true,
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

export default model<IRecruteurLbaUpdateEvent>("recruteurlbaupdateevents", recruteurLbaUpdateEventSchema)

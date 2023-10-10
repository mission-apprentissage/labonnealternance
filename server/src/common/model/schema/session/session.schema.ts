import { ISession } from "shared"

import { model, Schema } from "../../../mongodb"

export const sessionSchema = new Schema<ISession>(
  {
    token: {
      type: String,
      description: "Token de la session",
    },
    updated_at: {
      type: Date,
      default: Date.now,
      description: "Date de mise à jour en base de données",
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "Date d'ajout en base de données",
    },
  },
  {
    versionKey: false,
  }
)

sessionSchema.index({ token: 1 })

export default model<ISession>("session", sessionSchema)

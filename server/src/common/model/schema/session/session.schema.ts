import { ISession } from "shared"

import config from "@/config"

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
    expires_at: {
      type: Date,
      default: Date.now,
      description: "Date d'expiration",
    },
  },
  {
    versionKey: false,
  }
)

sessionSchema.index({ token: 1 })
// @ts-expect-error
sessionSchema.index({ expires_at: 1 }, { expireAfterSeconds: config.auth.session.cookie.maxAge / 100 })

export default model<ISession>("session", sessionSchema)

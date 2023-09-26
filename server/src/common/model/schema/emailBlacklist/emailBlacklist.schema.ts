import { model, Schema } from "../../../mongodb"

import { IEmailBlacklist } from "./emailBlacklist.types"

export const emailBlacklistSchema = new Schema<IEmailBlacklist>({
  email: {
    type: String,
    require: true,
    description: "L'adresse d'un établissement",
    index: true,
    unique: true,
  },
  blacklisting_origin: {
    type: String,
    require: true,
    description: "Source de l'information de blacklisting",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "La date création de l'enregistrement",
  },
})

export default model<IEmailBlacklist>("emailblacklist", emailBlacklistSchema)

import { model, Schema } from "../../../mongodb.js"
import { IEmailBlacklist } from "./emailBlacklist.types.js"

export const emailBlacklistSchema = new Schema<IEmailBlacklist>({
  email: {
    type: String,
    default: null,
    description: "L'adresse d'un établissement",
    index: true,
    unique: true,
  },
  blacklisting_origin: {
    type: String,
    default: null,
    description: "Source de l'information de blacklisting",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "La date création de l'enregistrement",
  },
})

export default model<IEmailBlacklist>("emailblacklist", emailBlacklistSchema)

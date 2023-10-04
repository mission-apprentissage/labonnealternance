import { model, Schema } from "../../../mongodb.js"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema.js"

import { IUnsubscribedLbaCompany } from "./unsubscribedLbaCompany.types.js"

const unsubscribedLbaCompanySchema = new Schema<IUnsubscribedLbaCompany>(
  {
    ...lbaCompanySchema.obj,
    unsubscribe_date: {
      type: Date,
      default: Date.now,
      description: "Date de désinscription",
    },
    unsubscribe_reason: {
      type: String,
      default: null,
      description: "Raison de la désinscription",
    },
  },
  {
    versionKey: false,
  }
)

export default model<IUnsubscribedLbaCompany>("unsubscribedbonnesboites", unsubscribedLbaCompanySchema)

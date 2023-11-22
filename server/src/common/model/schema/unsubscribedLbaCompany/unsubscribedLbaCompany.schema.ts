import { IUnsubscribedLbaCompany } from "shared"

import { model, Schema } from "../../../mongodb.js"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema.js"

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

export const UnsubscribedLbaCompany = model<IUnsubscribedLbaCompany>("unsubscribedbonnesboites", unsubscribedLbaCompanySchema)

export default UnsubscribedLbaCompany

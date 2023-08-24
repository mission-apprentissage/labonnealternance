import { model, Schema } from "../../../mongodb.js"
import { lbaCompanySchema } from "../lbaCompany/lbaCompany.schema.js"
import { IUnsubscribedBonneBoite } from "./unsubscribedBonneBoite.types.js"

const unsubscribedBonneBoiteSchema = new Schema<IUnsubscribedBonneBoite>({
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
})

export default model<IUnsubscribedBonneBoite>("unsubscribedbonnesboites", unsubscribedBonneBoiteSchema)

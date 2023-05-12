import { model, Schema } from "../../../mongodb.js"
import { bonneBoiteSchema } from "../bonneboite/bonneBoite.schema.js"
import { IUnsubscribedBonneBoite } from "./unsubscribedBonneBoite.types.js"

const unsubscribedBonneBoiteSchema = new Schema<IUnsubscribedBonneBoite>({
  ...bonneBoiteSchema.obj,
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

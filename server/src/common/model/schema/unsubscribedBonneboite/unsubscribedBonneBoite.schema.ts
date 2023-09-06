import { model, Schema } from "../../../mongodb"
import { bonneBoiteSchema } from "../bonneboite/bonneBoite.schema"

import { IUnsubscribedBonneBoite } from "./unsubscribedBonneBoite.types"

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

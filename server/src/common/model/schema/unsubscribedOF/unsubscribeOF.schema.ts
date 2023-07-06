import { model, Schema } from "../../../mongodb.js"
import { IUnsubscribedOF } from "./unsubscribeOF.types.js"

const unsubscribedOF = new Schema<IUnsubscribedOF>({
  siret: {
    type: String,
    default: null,
    description: "Le Siret de la société",
    index: true,
  },
  unsubscribe_date: {
    type: Date,
    default: Date.now,
    description: "Date de désinscription",
  },
})

export default model<IUnsubscribedOF>("unsubscribedOF", unsubscribedOF)

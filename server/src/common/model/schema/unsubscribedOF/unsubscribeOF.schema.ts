import { model, Schema } from "../../../mongodb.js"
import { IUnsubscribedOF } from "./unsubscribeOF.types.js"

const unsubscribedOF = new Schema<IUnsubscribedOF>({
  establishment_siret: {
    type: String,
    description: "Le Siret de l'organisme de formation",
    index: true,
  },
  unsubscribe_date: {
    type: Date,
    description: "Date de désinscription",
  },
})

export default model<IUnsubscribedOF>("unsubscribedOF", unsubscribedOF)

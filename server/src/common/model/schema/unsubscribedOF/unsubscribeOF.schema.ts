import { model, Schema } from "../../../mongodb"

import { IUnsubscribedOF } from "./unsubscribeOF.types"

const unsubscribedOF = new Schema<IUnsubscribedOF>({
  catalogue_id: {
    type: String,
    description: "Id de l'organisme dans le catalogue",
    index: true,
  },
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

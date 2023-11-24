import { IUnsubscribedOF } from "shared/models"

import { model, Schema } from "../../../mongodb"

const unsubscribedOFSchema = new Schema<IUnsubscribedOF>(
  {
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
  },
  {
    versionKey: false,
  }
)

export const UnsubscribeOF = model<IUnsubscribedOF>("unsubscribedOF", unsubscribedOFSchema)

export default UnsubscribeOF

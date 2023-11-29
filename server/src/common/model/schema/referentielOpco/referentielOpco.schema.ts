import { OPCOS } from "shared/constants/recruteur"
import { IReferentielOpco } from "shared/models"

import { model, Schema } from "../../../mongodb"

export const referentielOpcoSchema = new Schema<IReferentielOpco>(
  {
    opco_label: {
      type: String,
      required: true,
      enum: Object.values(OPCOS),
      description: "Dénomination de l'opco",
    },
    siret_code: {
      type: String,
      description: "Siret de l'établissement",
      index: true,
    },
    emails: {
      type: [String],
      description: "Liste des emails disponibles pour l'établissement",
      index: true,
    },
  },
  {
    versionKey: false,
  }
)

export const ReferentielOpco = model<IReferentielOpco>("referentielOpco", referentielOpcoSchema)

export default ReferentielOpco

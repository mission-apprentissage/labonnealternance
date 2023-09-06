import { OPCOS } from "../../../../services/constant.service"
import { model, Schema } from "../../../mongodb"

import { IReferentielOpco } from "./referentielOpco.types"

export const referentielOpcoSchema = new Schema<IReferentielOpco>({
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
})

export default model<IReferentielOpco>("referentielOpco", referentielOpcoSchema)

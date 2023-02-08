import { OPCOS } from "../../constants.js"

export const referentielOpcoSchema = {
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
}

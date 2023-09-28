import { model, Schema } from "../../../mongodb"

import { IReferentielOnisep } from "./referentielOnisep.types"

export const referentielOnisepSchema = new Schema<IReferentielOnisep>(
  {
    id_action_ideo2: {
      type: String,
      required: true,
      index: true,
      description: "ID action IDEO2",
    },
    cle_ministere_educatif: {
      type: String,
      required: true,
      description: "Clé ministère educatif",
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "Date de création",
    },
  },
  {
    versionKey: false,
  }
)

export default model<IReferentielOnisep>("referentielOnisep", referentielOnisepSchema)

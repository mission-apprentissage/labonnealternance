import { model, Schema } from "../../../mongodb.js"
import { IReferentielOnisep } from "./referentielOnisep.types.js"

export const referentielOnisepSchema = new Schema<IReferentielOnisep>({
  id_formation_catalogue: {
    type: String,
    required: true,
    description: "ID formation Catalogue",
  },
  source_ideo2: {
    type: String,
    required: true,
    description: "Champ filtrage IDEO2",
  },
  id_formation_ideo2: {
    type: String,
    required: true,
    description: "ID formation IDEO2",
  },
  id_action_ideo2: {
    type: String,
    required: true,
    description: "ID action IDEO2",
  },
  id_enseignement_ideo2: {
    type: String,
    required: true,
    description: "ID enseignement IDEO2",
  },
  cle_ministere_educatif: {
    type: String,
    required: true,
    description: "Clé ministère educatif",
  },
})

export default model<IReferentielOnisep>("referentielOnisep", referentielOnisepSchema)

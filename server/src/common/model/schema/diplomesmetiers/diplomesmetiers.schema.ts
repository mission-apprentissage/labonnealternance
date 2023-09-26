import { mongoosastic } from "../../../esClient/index"
import { model, Schema } from "../../../mongodb"

import { IDiplomesMetiers } from "./diplomesmetiers.types"

export const diplomesMetiersSchema = new Schema<IDiplomesMetiers>({
  intitule_long: {
    type: String,
    require: true,
    description: "Le nom long d'un diplôme",
  },
  codes_romes: {
    type: [String],
    default: [],
    description: "Les codes Romes associés au diplôme",
  },
  codes_rncps: {
    type: [String],
    default: [],
    description: "Les codes RNCPs associés au diplôme",
  },
  acronymes_intitule: {
    type: String,
    require: true,
    description: "Les acronymes construit à partir de l'intitulé",
  },
  created_at: {
    type: Date,
    default: Date.now,
    description: "Date d'ajout en base de données",
  },
  last_update_at: {
    type: Date,
    default: Date.now,
    description: "Date de dernières mise à jour",
  },
})

diplomesMetiersSchema.plugin(mongoosastic, { index: "diplomesmetiers" })

export default model<IDiplomesMetiers>("diplomesmetiers", diplomesMetiersSchema)

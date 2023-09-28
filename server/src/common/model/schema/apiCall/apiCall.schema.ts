import { model, Schema } from "../../../mongodb"

import { IApiCall } from "./apiCall.types"

export const apiCallSchema = new Schema<IApiCall>(
  {
    caller: {
      type: String,
      require: true,
      description: "Le service faisant appel à l'API",
    },
    api_path: {
      type: String,
      require: true,
      description: "Le endpoint appelé",
    },
    response: {
      type: String,
      require: true,
      description: "Le résultat de l'appel",
    },
    training_count: {
      type: Number,
      default: 0,
      description: "Le nombre de formations retournées",
    },
    job_count: {
      type: Number,
      default: 0,
      description: "Le nombre d'opportunités d'emploi retournées",
    },
    result_count: {
      type: Number,
      default: 0,
      description: "Le nombre total d'items retournés",
    },
    created_at: {
      type: Date,
      default: Date.now,
      description: "Date d'ajout en base de données",
    },
  },
  {
    versionKey: false,
  }
)

export default model<IApiCall>("apicalls", apiCallSchema)

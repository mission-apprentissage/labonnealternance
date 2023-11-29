import { model, Schema } from "../../../mongodb"

import { ISiretDiffusibleStatus } from "./siretDiffusibleStatus.types"

export const siretDiffusibleStatusSchema = new Schema<ISiretDiffusibleStatus>(
  {
    siret: {
      type: String,
      require: true,
      description: "Le siret cherché",
      unique: true,
    },
    status_diffusion: {
      type: String,
      default: "diffusible",
      description: "Le statut de diffusion : diffusible | partiellement_diffusible | non_diffusible",
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
  },
  {
    versionKey: false,
  }
)

export default model<ISiretDiffusibleStatus>("siretdiffusiblestatus", siretDiffusibleStatusSchema)

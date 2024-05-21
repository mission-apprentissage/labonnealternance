import { IFicheMetierRomeV4 } from "shared/models"

import { Schema, model } from "../../../mongodb"

export const ficheMetierRomeV4Schema = new Schema<IFicheMetierRomeV4>(
  {
    rome_code: {
      type: String,
      description: "Code Rome",
    },
    fiche_metier: {
      type: Object,
      description: "Fiche metier Rome V4",
    },
  },
  {
    versionKey: false,
  }
)

ficheMetierRomeV4Schema.index({ rome_code: 1 })
ficheMetierRomeV4Schema.index({ "fiche_metier.appellations.code": 1 })

export default model<IFicheMetierRomeV4>("ficheMetierRomeV4", ficheMetierRomeV4Schema)

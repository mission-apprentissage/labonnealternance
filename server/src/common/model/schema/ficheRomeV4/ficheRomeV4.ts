import { IRomeV4DetailsFromAPI } from "../../../../services/rome.service.types"
import { Schema, model } from "../../../mongodb"

interface IFicheMeterRomeV4 {
  code: string
  fiche_metier: IRomeV4DetailsFromAPI
}

export const ficheMetierRomeV4Schema = new Schema<IFicheMeterRomeV4>({
  code: {
    type: String,
    description: "Code Rome",
  },
  fiche_metier: {
    type: Object,
    description: "Fiche metier Rome V4",
  },
})

ficheMetierRomeV4Schema.index({ code: 1 })
ficheMetierRomeV4Schema.index({ "fiche_metier.appellations.code": 1 })

export default model<IFicheMeterRomeV4>("ficheMetierRomeV4", ficheMetierRomeV4Schema)

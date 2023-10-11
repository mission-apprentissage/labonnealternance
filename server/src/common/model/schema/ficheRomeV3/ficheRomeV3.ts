import { IRomeDetailsFromAPI } from "../../../../services/rome.service.types"
import { Schema, model } from "../../../mongodb"

interface IFicheMeterRomeV3 {
  code: string
  fiche_metier: IRomeDetailsFromAPI
}

export const ficheMetierRomeV3Schema = new Schema<IFicheMeterRomeV3>({
  code: {
    type: String,
    description: "Code Rome",
  },
  fiche_metier: {
    type: Object,
    description: "Fiche metier Rome V3",
  },
})

ficheMetierRomeV3Schema.index({ code: 1 })

export default model<IFicheMeterRomeV3>("ficheMetierRomeV3", ficheMetierRomeV3Schema)

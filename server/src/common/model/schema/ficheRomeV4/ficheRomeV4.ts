import { IFicheRomeV4 } from "shared/models"

import { Schema, model } from "../../../mongodb"

export const referentielRomeSchema = new Schema<IFicheRomeV4>(
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

referentielRomeSchema.index({ rome_code: 1 })
referentielRomeSchema.index({ "fiche_metier.appellations.code": 1 })

export default model<IFicheRomeV4>("referentielRomes", referentielRomeSchema)

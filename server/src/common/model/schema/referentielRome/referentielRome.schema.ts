import { model, Schema } from "../../../mongodb.js"
import { IMobiliteItem, IReferentielRome } from "./referentielRome.types.js"

const mobiliteSchema = new Schema<IMobiliteItem>(
  {
    appellation_source: String,
    code_ogr_appellation_source: String,
    rome_cible: String,
    code_org_rome_cible: String,
    appellation_cible: String,
    code_ogr_appellation_cible: String,
  },
  { _id: false, versionKey: false }
)

export const referentielRomeSchema = new Schema<IReferentielRome>(
  {
    numero: {
      type: String,
      description: "Numéro d'identification de la fiche emploi",
    },
    rome: {
      code_rome: String,
      intitule: String,
      code_ogr: String,
    },
    appellations: {
      type: Array,
      items: {
        libelle: String,
        libelle_court: String,
        code_ogr: String,
      },
      description: "Liste des appellations lié au code rome",
    },
    definition: String,
    acces_metier: String,
    competences: {
      savoir_faire: Array,
      savoir_etre_professionnel: Array,
      savoirs: Array,
    },
    contextes_travail: {
      type: Array,
    },
    mobilites: {
      proche: [mobiliteSchema],
      si_evolution: [mobiliteSchema],
    },
  },
  { versionKey: false }
)

referentielRomeSchema.index({ "appelations.libelle": "text" })

export default model<IReferentielRome>("referentielRome", referentielRomeSchema)

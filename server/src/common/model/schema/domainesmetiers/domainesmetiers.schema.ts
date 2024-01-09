import { Schema, model } from "../../../mongodb"

import { IDomainesMetiers } from "./domainesmetiers.types"

export const domainesMetiersSchema = new Schema<IDomainesMetiers>(
  {
    sous_domaine: {
      type: String,
      require: true,
      description: "Le sous-domaine d'un métier",
    },
    sous_domaine_sans_accent_computed: {
      type: String,
      require: true,
      description: "Le sous-domaine d'un métier sans caractère accentué",
    },
    domaine: {
      type: String,
      default: null,
      description: "Le grand domaine d'un métier",
    },
    domaine_sans_accent_computed: {
      type: String,
      default: null,
      description: "Le grand domaine d'un métier sans caractère accentué",
    },
    codes_romes: {
      type: [String],
      default: [],
      description: "Les codes Romes associés au métier",
    },
    intitules_romes: {
      type: [String],
      default: [],
      description: "Les libellés des codes ROMEs associés au métier",
    },
    intitules_romes_sans_accent_computed: {
      type: [String],
      default: [],
      description: "Les libellés des codes ROMEs associés au métier sans caractère accentué",
    },
    codes_rncps: {
      type: [String],
      default: [],
      description: "Les codes RNCPs associés au métier",
    },
    intitules_rncps: {
      type: [String],
      default: [],
      description: "Les libellés des codes RNCPs associés au métier",
    },
    intitules_rncps_sans_accent_computed: {
      type: [String],
      default: [],
      description: "Les libellés des codes RNCPs associés au métier sans caractère accentué",
    },
    mots_clefs: {
      type: String,
      require: true,
      description: "Les mots clefs associés au métier",
    },
    mots_clefs_sans_accent_computed: {
      type: String,
      require: true,
      description: "Les mots clefs associés au métier sans caractère accentué",
    },
    mots_clefs_specifiques: {
      type: String,
      require: true,
      description: "Les mots clefs associés à une ligne spécifique du métier",
    },
    mots_clefs_specifiques_sans_accent_computed: {
      type: String,
      require: true,
      description: "Les mots clefs associés à une ligne spécifique du métier sans caractère accentué",
    },
    appellations_romes: {
      type: String,
      require: true,
      description: "Mots clefs tirés des appellations associées à un code ROME",
    },
    appellations_romes_sans_accent_computed: {
      type: String,
      require: true,
      description: "Mots clefs tirés des appellations associées à un code ROME sans caractère accentué",
    },
    couples_appellations_rome_metier: {
      type: [Object],
      default: [],
      description: "Couple Appellation, code et libelle ROME",
    },
    codes_fap: {
      type: [String],
      default: [],
      description: "Liste des codes FAP",
    },
    intitules_fap: {
      type: [String],
      default: [],
      description: "Mots clefs issus des libellés FAP",
    },
    intitules_fap_sans_accent_computed: {
      type: [String],
      default: [],
      description: "Mots clefs issus des libellés FAP sans caractère accentué",
    },
    sous_domaine_onisep: {
      type: [String],
      default: [],
      description: "Les sous-domaines onisep",
    },
    sous_domaine_onisep_sans_accent_computed: {
      type: [String],
      default: [],
      description: "Les sous-domaines onisep sans caractère accentué",
    },
    couples_romes_metiers: {
      type: [Object],
      default: [],
      description: "Couples codes ROMEs / intitulés correspondants au métier",
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

export default model<IDomainesMetiers>("domainesmetiers", domainesMetiersSchema)

import { randomUUID } from "crypto"

import { IRecruiter } from "shared"

import { RECRUITER_STATUS } from "../../../../services/constant.service"
import { model, Schema } from "../../../mongodb"
import { mongoosePagination, Pagination } from "../_shared/mongoose-paginate"
import { geoPointSchema } from "../geopoint/geoPoint.schema"
import { jobsSchema } from "../jobs/jobs.schema"

const personalInfosRecruiterSchema = new Schema({
  last_name: {
    type: String,
    default: null,
    description: "Nom du contact",
  },
  first_name: {
    type: String,
    default: null,
    description: "Prénom du contact",
  },
  phone: {
    type: String,
    default: null,
    description: "Téléphone du contact",
  },
  email: {
    type: String,
    description: "Email du contact",
    require: true,
  },
  managed_by: {
    type: String,
    default: null,
    description: "Id de l'utilisateur gestionnaire",
  },
})

export const nonPersonalInfosRecruiterSchema = new Schema({
  establishment_id: {
    type: String,
    default: () => randomUUID(),
    description: "Identifiant de formulaire unique",
    index: true,
  },
  establishment_raison_sociale: {
    type: String,
    default: null,
    description: "Raison social de l'entreprise",
  },
  establishment_enseigne: {
    type: String,
    default: null,
    description: "Enseigne de l'entreprise",
  },
  establishment_siret: {
    type: String,
    require: true,
    description: "Numéro SIRET de l'entreprise",
  },
  address_detail: {
    type: Object,
    description: "Détail de l'adresse de l'entreprise",
  },
  address: {
    type: String,
    default: null,
    description: "Adresse de l'entreprise",
  },
  geo_coordinates: {
    type: String,
    default: null,
    description: "Latitude/Longitude (inversion lié à LBA) de l'adresse de l'entreprise",
  },
  geopoint: {
    type: geoPointSchema,
    default: null,
    description: "La géolocation de l'adresse de l'entreprise sous forme de geoPoint",
  },
  is_delegated: {
    type: Boolean,
    default: false,
    description: "le formulaire est-il géré par un mandataire ?",
  },
  cfa_delegated_siret: {
    type: String,
    description: "Siret de l'organisme de formation gestionnaire des offres de l'entreprise",
  },

  jobs: [{ type: jobsSchema, default: {}, description: "Liste des offres d'apprentissage" }],
  origin: {
    type: String,
    default: null,
    description: "Origine/organisme lié au formulaire",
  },
  opco: {
    type: String,
    description: "Information sur l'opco de l'entreprise",
  },
  idcc: {
    type: String,
    description: "Identifiant convention collective de l'entreprise",
  },
  status: {
    type: String,
    enum: Object.values(RECRUITER_STATUS),
    default: RECRUITER_STATUS.ACTIF,
    description: "Statut du formulaire",
  },
  naf_code: {
    type: String,
    description: "code NAF de l'entreprise",
  },
  naf_label: {
    type: String,
    description: "Libelle du code NAF de l'entreprise",
  },
  establishment_size: {
    type: String,
    description: "Tranche d'effectif salariale de l'entreprise",
  },
  establishment_creation_date: {
    type: Date,
    description: "Date de creation de l'entreprise",
  },
})

export const recruiterSchema = new Schema<IRecruiter>(
  {
    ...personalInfosRecruiterSchema.obj,
    ...nonPersonalInfosRecruiterSchema.obj,
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

recruiterSchema.index({ "jobs._id": 1 })
recruiterSchema.plugin(mongoosePagination)

export default model<IRecruiter, Pagination<IRecruiter>>("recruiter", recruiterSchema)
